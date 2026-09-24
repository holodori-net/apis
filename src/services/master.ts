import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { requireResponseString } from "../core/response.js";
import { type ApiSession } from "../core/session.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type MasterGetResponse,
  MasterGetResponseSchema,
} from "../protos/gen/rpc/api/master.gen_pb.js";

const MASTER_GET: ApiMethod<void, MasterGetResponse> = {
  path: "/rpc.api.Master/Get",
  requiresGameAuth: false,
  requiresMasterVersion: false,
  usesResponseCache: false,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (response) => decodeProtobuf(MasterGetResponseSchema, response),
};

/** Retrieves master data required by authenticated game APIs. */
export class MasterApi {
  constructor(
    private readonly client: ApiClient,
    private readonly session: ApiSession,
  ) {}

  /** Fetches and stores the current master-data version and tag packs. @remarks The version is stored in this SDK session. @rpc /rpc.api.Master/Get */
  async get(options?: RequestOptions): Promise<MasterGetResponse> {
    const response = await this.client.call(MASTER_GET, undefined, options);
    this.session.setMasterVersion(
      requireResponseString(
        response.version,
        "master version",
        MASTER_GET.path,
      ),
    );
    return response;
  }

  /** Returns the current master-data version. */
  async getVersion(options?: RequestOptions): Promise<string> {
    return (await this.get(options)).version;
  }
}

export { MASTER_GET };
export type { MasterGetResponse };
