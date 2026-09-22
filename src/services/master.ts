import {
  decodeMasterVersionResponse,
  encodeMasterGetRequest,
} from "../codecs/master.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type ApiSession } from "../core/session.js";

const MASTER_GET: ApiMethod<void, string> = {
  path: "/rpc.api.Master/Get",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: encodeMasterGetRequest,
  decode: decodeMasterVersionResponse,
};

export class MasterApi {
  constructor(
    private readonly client: ApiClient,
    private readonly session: ApiSession,
  ) {}

  async get(): Promise<string> {
    const masterVersion = await this.client.call(MASTER_GET, undefined);
    this.session.setMasterVersion(masterVersion);
    return masterVersion;
  }
}

export { MASTER_GET };
