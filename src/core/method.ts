/** Describes the protocol policies attached to one unary game API method. */
export interface ApiMethod<Request, Response> {
  readonly path: `/rpc.api.${string}`;
  readonly requiresGameAuth: boolean;
  readonly requiresMasterVersion: boolean;
  readonly usesResponseCache: boolean;
  readonly requiresRequestSignature: boolean;
  readonly encode: (request: Request) => Buffer;
  readonly decode: (response: Buffer) => Response;
}

export interface RequestSignatureInput {
  readonly path: string;
  readonly body: Buffer;
  readonly headers: Readonly<Record<string, string>>;
}

export interface RequestSigner {
  sign(input: RequestSignatureInput): Readonly<Record<string, string>>;
}
