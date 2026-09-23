import {
  decodeGachaListProbabilityResponse,
  decodeGachaListResponse,
  encodeGachaListProbabilityRequest,
  encodeGachaListRequest,
  type GachaListProbabilityResponse,
  type GachaListResponse,
} from "../codecs/gacha.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";

const GACHA_LIST: ApiMethod<void, GachaListResponse> = {
  path: "/rpc.api.Gacha/List",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeGachaListRequest,
  decode: decodeGachaListResponse,
};

const GACHA_LIST_NORMAL_PROBABILITY: ApiMethod<
  { readonly gachaId: string },
  GachaListProbabilityResponse
> = {
  path: "/rpc.api.Gacha/ListNormalProbability",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ gachaId }) => encodeGachaListProbabilityRequest(gachaId),
  decode: decodeGachaListProbabilityResponse,
};

const GACHA_LIST_CARD_SELECT_PROBABILITY: ApiMethod<
  { readonly gachaId: string },
  GachaListProbabilityResponse
> = {
  path: "/rpc.api.Gacha/ListCardSelectProbability",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ gachaId }) => encodeGachaListProbabilityRequest(gachaId),
  decode: decodeGachaListProbabilityResponse,
};

/** Provides Gacha banners, draw configuration, and probabilities. */
export class GachaApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Lists Gacha groups and their active configurations, costs, rewards, and
   * card selection options. Lock, read-time, draw-count, and selected-card
   * fields describe the authenticated account.
   *
   * @rpc /rpc.api.Gacha/List
   */
  async list(): Promise<GachaListResponse> {
    await this.ensureAuthenticated();
    return this.client.call(GACHA_LIST, undefined);
  }

  /**
   * Lists ordinary-draw rarity and card probabilities for one Gacha.
   * Probabilities are returned as integer parts per ten million.
   *
   * @rpc /rpc.api.Gacha/ListNormalProbability
   */
  async listNormalProbability(
    gachaId: string,
  ): Promise<GachaListProbabilityResponse> {
    await this.ensureAuthenticated();
    return this.client.call(GACHA_LIST_NORMAL_PROBABILITY, { gachaId });
  }

  /**
   * Lists card-select draw rarity and card probabilities for one Gacha.
   * Probabilities are returned as integer parts per ten million.
   *
   * @rpc /rpc.api.Gacha/ListCardSelectProbability
   * @remarks The server may reject the request until the authenticated account
   * has selected cards for the Gacha.
   */
  async listCardSelectProbability(
    gachaId: string,
  ): Promise<GachaListProbabilityResponse> {
    await this.ensureAuthenticated();
    return this.client.call(GACHA_LIST_CARD_SELECT_PROBABILITY, { gachaId });
  }
}

export {
  GACHA_LIST,
  GACHA_LIST_CARD_SELECT_PROBABILITY,
  GACHA_LIST_NORMAL_PROBABILITY,
};
export type {
  GachaButton,
  GachaCardBonus,
  GachaCardProbability,
  GachaCardSelect,
  GachaConsumption,
  GachaGroup,
  GachaInfo,
  GachaListProbabilityResponse,
  GachaListResponse,
  GachaPoint,
  GachaRarityProbability,
  GachaReward,
} from "../codecs/gacha.js";
