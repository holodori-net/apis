import { type ApiTransportErrorPhase } from "../transports/error.js";

export type HolodoriApiErrorKind =
  | "authentication"
  | "configuration"
  | "grpc"
  | "http"
  | "protocol"
  | "transport";

export interface HolodoriApiErrorOptions {
  readonly kind: HolodoriApiErrorKind;
  readonly rpcPath: string;
  readonly httpStatus?: number;
  readonly grpcStatus?: number;
  readonly requestId?: string;
  readonly transportPhase?: ApiTransportErrorPhase;
  readonly cause?: unknown;
}

/** A structured failure from a high-level game API call. */
export class HolodoriApiError extends Error {
  readonly kind: HolodoriApiErrorKind;
  readonly rpcPath: string;
  readonly httpStatus: number | undefined;
  readonly grpcStatus: number | undefined;
  readonly requestId: string | undefined;
  readonly transportPhase: ApiTransportErrorPhase | undefined;
  /** @deprecated Use `httpStatus`. */
  readonly status: number | undefined;
  /** @deprecated Use `rpcPath`. */
  readonly path: string;

  constructor(message: string, path: string, status?: number);
  constructor(message: string, options: HolodoriApiErrorOptions);
  constructor(
    message: string,
    pathOrOptions: HolodoriApiErrorOptions | string,
    status?: number,
  ) {
    const options: HolodoriApiErrorOptions =
      typeof pathOrOptions === "string"
        ? {
            kind: status === undefined ? "configuration" : "http",
            rpcPath: pathOrOptions,
            ...(status === undefined ? {} : { httpStatus: status }),
          }
        : pathOrOptions;
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "HolodoriApiError";
    this.kind = options.kind;
    this.rpcPath = options.rpcPath;
    this.httpStatus = options.httpStatus;
    this.grpcStatus = options.grpcStatus;
    this.requestId = options.requestId;
    this.transportPhase = options.transportPhase;
    this.path = options.rpcPath;
    this.status = options.httpStatus;
  }
}
