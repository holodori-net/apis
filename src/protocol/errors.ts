/** A malformed or unsupported game protocol payload. */
export class ProtoEncError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ProtoEncError";
  }
}
