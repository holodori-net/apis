/** Per-call controls applied to one RPC request. */
export interface RequestOptions {
  /** Cancels the RPC request. Automatic authentication bootstrap is separate. */
  readonly signal?: AbortSignal;
  /** Overrides the client's timeout for this RPC; bootstrap uses the client default. */
  readonly timeoutMs?: number;
}
