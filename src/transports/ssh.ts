import { spawn } from "node:child_process";
import { Duplex } from "node:stream";

import type { ApiTunnelConnector, ApiTunnelContext } from "./types.js";

import { ApiTransportError } from "./error.js";
import { Http2Transport } from "./http2.js";
import { targetAuthority } from "./socket.js";

const FORCED_SSH_OPTIONS = [
  "BatchMode=yes",
  "NumberOfPasswordPrompts=0",
  "StrictHostKeyChecking=yes",
] as const;
const FORCED_OPTION_NAMES = new Set(
  FORCED_SSH_OPTIONS.map((option) =>
    option.slice(0, option.indexOf("=")).toLowerCase(),
  ),
);

export interface SshHttp2TransportOptions {
  readonly target: string;
  readonly sshExecutable?: string;
  readonly configFile?: string;
  readonly options?: readonly string[];
}

export class SshHttp2Transport extends Http2Transport {
  constructor(options: SshHttp2TransportOptions) {
    super({ connector: new OpenSshTunnelConnector(options) });
  }
}

export class OpenSshTunnelConnector implements ApiTunnelConnector {
  private readonly options: Required<
    Pick<SshHttp2TransportOptions, "sshExecutable" | "target">
  > &
    Omit<SshHttp2TransportOptions, "sshExecutable" | "target">;

  constructor(options: SshHttp2TransportOptions) {
    validateSshOptions(options);
    this.options = {
      ...options,
      sshExecutable: options.sshExecutable ?? "ssh",
    };
  }

  connect(target: URL, context: ApiTunnelContext): Promise<Duplex> {
    const child = spawn(
      this.options.sshExecutable,
      buildSshForwardArguments(this.options, targetAuthority(target)),
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      if (stderr.length < 8_192)
        stderr += chunk.slice(0, 8_192 - stderr.length);
    });
    const tunnel = Duplex.from({
      readable: child.stdout,
      writable: child.stdin,
    });
    const fail = (message: string, cause?: unknown) => {
      if (tunnel.destroyed) return;
      const detail = stderr.trim();
      tunnel.destroy(
        new ApiTransportError(
          `${message}${detail ? `: ${detail}` : ""}`,
          "ssh",
          cause,
        ),
      );
    };
    const onAbort = () => {
      tunnel.destroy(new ApiTransportError("SSH tunnel aborted", "aborted"));
    };
    child.once("error", (error) =>
      fail("failed to start SSH executable", error),
    );
    child.once("exit", (code, signal) => {
      if (code !== 0 && !context.signal.aborted) {
        fail(`SSH tunnel exited with ${code ?? signal ?? "unknown status"}`);
      }
    });
    tunnel.once("close", () => {
      context.signal.removeEventListener("abort", onAbort);
      if (child.exitCode === null && child.signalCode === null) child.kill();
    });
    if (context.signal.aborted) onAbort();
    else context.signal.addEventListener("abort", onAbort, { once: true });
    return Promise.resolve(tunnel);
  }
}

export function buildSshForwardArguments(
  options: SshHttp2TransportOptions,
  destination: string,
): string[] {
  validateSshOptions(options);
  if (!destination || /[\r\n\0]/.test(destination)) {
    throw new ApiTransportError(
      "invalid SSH forwarding destination",
      "validation",
    );
  }
  return [
    ...(options.configFile ? ["-F", options.configFile] : []),
    "-T",
    ...FORCED_SSH_OPTIONS.flatMap((option) => ["-o", option]),
    ...(options.options ?? []).flatMap((option) => ["-o", option]),
    "-W",
    destination,
    options.target,
  ];
}

function validateSshOptions(options: SshHttp2TransportOptions): void {
  validateArgument(options.target, "SSH target", true);
  if (options.sshExecutable !== undefined) {
    validateArgument(options.sshExecutable, "SSH executable", false);
  }
  if (options.configFile !== undefined) {
    validateArgument(options.configFile, "SSH config file", false);
  }
  for (const option of options.options ?? []) {
    validateArgument(option, "SSH option", true);
    const separator = option.indexOf("=");
    if (separator <= 0) {
      throw new ApiTransportError(
        "SSH options must use KEY=VALUE syntax",
        "validation",
      );
    }
    const name = option.slice(0, separator);
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) {
      throw new ApiTransportError(
        "SSH option names must be alphanumeric",
        "validation",
      );
    }
    if (FORCED_OPTION_NAMES.has(name.toLowerCase())) {
      throw new ApiTransportError(
        `SSH option ${name} is controlled by the SDK`,
        "validation",
      );
    }
  }
}

function validateArgument(
  value: string,
  name: string,
  rejectLeadingDash: boolean,
): void {
  if (
    !value ||
    /[\r\n\0]/.test(value) ||
    (rejectLeadingDash && value.startsWith("-"))
  ) {
    throw new ApiTransportError(`invalid ${name}`, "validation");
  }
}
