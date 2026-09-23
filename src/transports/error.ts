export type ApiTransportErrorPhase =
  | "aborted"
  | "closed"
  | "connect"
  | "http2"
  | "proxy"
  | "ssh"
  | "timeout"
  | "tls"
  | "validation";

export class ApiTransportError extends Error {
  readonly phase: ApiTransportErrorPhase;

  constructor(message: string, phase: ApiTransportErrorPhase, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiTransportError";
    this.phase = phase;
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
