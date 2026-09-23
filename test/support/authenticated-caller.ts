import {
  type ApiCaller,
  AuthenticatedApiCaller,
} from "../../src/core/caller.js";
import { type ApiClient } from "../../src/core/client.js";

export function authenticatedCaller(
  client: ApiCaller,
  ensureAuthenticated: () => Promise<unknown>,
): ApiCaller {
  return new AuthenticatedApiCaller(client as ApiClient, ensureAuthenticated);
}
