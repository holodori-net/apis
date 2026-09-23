import {
  type CardGetParameterResponse,
  type CardGetParametersResponse,
  decodeCardGetParameterResponse,
  decodeCardGetParametersResponse,
  encodeCardGetParameterRequest,
  encodeCardGetParametersRequest,
} from "../codecs/card.js";
import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const CARD_GET_PARAMETER: ApiMethod<
  { readonly cardId: string },
  CardGetParameterResponse
> = {
  path: "/rpc.api.Card/GetParameter",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: ({ cardId }) => encodeCardGetParameterRequest(cardId),
  decode: decodeCardGetParameterResponse,
};

const CARD_GET_PARAMETERS: ApiMethod<void, CardGetParametersResponse> = {
  path: "/rpc.api.Card/GetParameters",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeCardGetParametersRequest,
  decode: decodeCardGetParametersResponse,
};

/** Reads server-calculated parameters for cards owned by the current account. */
export class CardApi {
  constructor(private readonly client: ApiCaller) {}

  /** Returns one owned card's current parameters and skill-tree effects. @rpc /rpc.api.Card/GetParameter */
  async getParameter(
    cardId: string,
    options?: RequestOptions,
  ): Promise<CardGetParameterResponse> {
    return this.client.call(CARD_GET_PARAMETER, { cardId }, options);
  }

  /** Returns current parameters for every card owned by the account. @rpc /rpc.api.Card/GetParameters */
  async getParameters(
    options?: RequestOptions,
  ): Promise<CardGetParametersResponse> {
    return this.client.call(CARD_GET_PARAMETERS, undefined, options);
  }
}

export { CARD_GET_PARAMETER, CARD_GET_PARAMETERS };
export type {
  CardGetParameterResponse,
  CardGetParametersResponse,
  CardParameterInfo,
  CardSkillTreeEffect,
} from "../codecs/card.js";
