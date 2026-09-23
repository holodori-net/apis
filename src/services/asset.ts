import {
  type AssetListExpiredAssetIdResponse,
  decodeAssetListExpiredAssetIdResponse,
  encodeAssetListExpiredAssetIdRequest,
} from "../codecs/asset.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const ASSET_LIST_EXPIRED_ASSET_ID: ApiMethod<
  void,
  AssetListExpiredAssetIdResponse
> = {
  path: "/rpc.api.Asset/ListExpiredAssetId",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeAssetListExpiredAssetIdRequest,
  decode: decodeAssetListExpiredAssetIdResponse,
};

/** Provides asset identifiers reported as expired by the game service. */
export class AssetApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /** Lists expired asset IDs grouped by the game feature that references them.
   *
   * @rpc /rpc.api.Asset/ListExpiredAssetId
   */
  async listExpiredAssetId(
    options?: RequestOptions,
  ): Promise<AssetListExpiredAssetIdResponse> {
    await this.ensureAuthenticated();
    return this.client.call(ASSET_LIST_EXPIRED_ASSET_ID, undefined, options);
  }
}

export { ASSET_LIST_EXPIRED_ASSET_ID };
export type {
  AssetListExpiredAssetIdResponse,
  ExpiredAssetIdList,
  ExpiredEventAssetIds,
  ExpiredGachaAssetIds,
  ExpiredLoginBonusAssetIds,
  ExpiredShopAssetIds,
} from "../codecs/asset.js";
