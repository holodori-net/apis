import type { Duplex } from "node:stream";

import { connect as connectTcp, isIP } from "node:net";
import { connect as connectTls, type TLSSocket } from "node:tls";

import { ApiTransportError, type ApiTransportErrorPhase } from "./error.js";

export function targetPort(url: URL): number {
  if (!url.port) return 443;
  const port = Number(url.port);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new ApiTransportError(
      "API URL contains an invalid port",
      "validation",
    );
  }
  return port;
}

export function targetAuthority(url: URL): string {
  const host = isIP(url.hostname) === 6 ? `[${url.hostname}]` : url.hostname;
  return `${host}:${targetPort(url)}`;
}

export function waitForSocket(
  socket: Duplex,
  event: "connect" | "secureConnect",
  signal: AbortSignal,
  phase: ApiTransportErrorPhase,
  label: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      socket.removeListener(event, onReady);
      socket.removeListener("error", onError);
      socket.removeListener("close", onClose);
      signal.removeEventListener("abort", onAbort);
    };
    const finish = (error?: Error) => {
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onReady = () => finish();
    const onError = (error: Error) =>
      finish(new ApiTransportError(`${label}: ${error.message}`, phase, error));
    const onClose = () =>
      finish(new ApiTransportError(`${label}: connection closed`, phase));
    const onAbort = () => {
      socket.destroy();
      finish(new ApiTransportError(`${label}: aborted`, "aborted"));
    };
    socket.once(event, onReady);
    socket.once("error", onError);
    socket.once("close", onClose);
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function connectDirect(
  url: URL,
  signal: AbortSignal,
): Promise<Duplex> {
  const socket = connectTcp({ host: url.hostname, port: targetPort(url) });
  await waitForSocket(
    socket,
    "connect",
    signal,
    "connect",
    "direct connection failed",
  );
  return socket;
}

export async function connectTargetTls(
  socket: Duplex,
  url: URL,
  signal: AbortSignal,
): Promise<TLSSocket> {
  const tlsSocket = connectTls({
    socket,
    ...(isIP(url.hostname) === 0 ? { servername: url.hostname } : {}),
    ALPNProtocols: ["h2"],
  });
  await waitForSocket(
    tlsSocket,
    "secureConnect",
    signal,
    "tls",
    "target TLS failed",
  );
  if (tlsSocket.alpnProtocol !== "h2") {
    tlsSocket.destroy();
    throw new ApiTransportError(
      `target did not negotiate HTTP/2 (ALPN=${tlsSocket.alpnProtocol || "none"})`,
      "tls",
    );
  }
  return tlsSocket;
}
