import { type ApiClient } from "./client.js";
import { type ApiMethod } from "./method.js";
import { type RequestOptions } from "./request-options.js";

export interface ApiCaller {
  call<Request, Response>(
    method: ApiMethod<Request, Response>,
    request: Request,
    options?: RequestOptions,
  ): Promise<Response>;
}

export class AuthenticatedApiCaller implements ApiCaller {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  async call<Request, Response>(
    method: ApiMethod<Request, Response>,
    request: Request,
    options?: RequestOptions,
  ): Promise<Response> {
    if (method.requiresGameAuth || method.requiresMasterVersion)
      await this.ensureAuthenticated();
    return this.client.call(method, request, options);
  }
}
