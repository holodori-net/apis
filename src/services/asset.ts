import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import { decodeProtobuf, encodeProtobuf } from "../protos/codec.js";
import { EmptySchema } from "../protos/gen/google/protobuf/empty_pb.js";
import {
  type AssetListExpiredAssetIdResponse,
  AssetListExpiredAssetIdResponseSchema,
} from "../protos/gen/rpc/api/asset.gen_pb.js";

const ASSET_LIST_EXPIRED_ASSET_ID: ApiMethod<
  void,
  AssetListExpiredAssetIdResponse
> = {
  path: "/rpc.api.Asset/ListExpiredAssetId",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: () => encodeProtobuf(EmptySchema),
  decode: (data) => decodeProtobuf(AssetListExpiredAssetIdResponseSchema, data),
};

/** Provides asset identifiers reported as expired by the game service. */
export class AssetApi {
  constructor(private readonly client: ApiCaller) {}

  /** Lists expired asset IDs grouped by the game feature that references them.
   *
   * @rpc /rpc.api.Asset/ListExpiredAssetId
   */
  async listExpiredAssetId(
    options?: RequestOptions,
  ): Promise<AssetListExpiredAssetIdResponse> {
    return this.client.call(ASSET_LIST_EXPIRED_ASSET_ID, undefined, options);
  }
}

export { ASSET_LIST_EXPIRED_ASSET_ID };
export type { AssetListExpiredAssetIdResponse } from "../protos/gen/rpc/api/asset.gen_pb.js";
