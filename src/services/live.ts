import {
  decodeLiveGetDeckCandidateCardParametersResponse,
  decodeLiveGetDeckResponse,
  decodeLiveGetDraftDeckInfoResponse,
  encodeLiveGetDeckCandidateCardParametersRequest,
  encodeLiveGetDeckRequest,
  encodeLiveGetDraftDeckInfoRequest,
  type LiveGetDeckCandidateCardParametersRequest,
  type LiveGetDeckCandidateCardParametersResponse,
  type LiveGetDeckRequest,
  type LiveGetDeckResponse,
  type LiveGetDraftDeckInfoRequest,
  type LiveGetDraftDeckInfoResponse,
} from "../codecs/live.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const LIVE_GET_DECK_CANDIDATE_CARD_PARAMETERS: ApiMethod<
  LiveGetDeckCandidateCardParametersRequest,
  LiveGetDeckCandidateCardParametersResponse
> = {
  path: "/rpc.api.Live/GetDeckCandidateCardParameters",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeLiveGetDeckCandidateCardParametersRequest,
  decode: decodeLiveGetDeckCandidateCardParametersResponse,
};

const LIVE_GET_DRAFT_DECK_INFO: ApiMethod<
  LiveGetDraftDeckInfoRequest,
  LiveGetDraftDeckInfoResponse
> = {
  path: "/rpc.api.Live/GetDraftDeckInfo",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeLiveGetDraftDeckInfoRequest,
  decode: decodeLiveGetDraftDeckInfoResponse,
};

const LIVE_GET_DECK: ApiMethod<LiveGetDeckRequest, LiveGetDeckResponse> = {
  path: "/rpc.api.Live/GetDeck",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeLiveGetDeckRequest,
  decode: decodeLiveGetDeckResponse,
};

/** Evaluates candidate and saved live decks with the game server's formulas. */
export class LiveApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /** Evaluates owned cards for a character, costume, and optional song. @rpc /rpc.api.Live/GetDeckCandidateCardParameters */
  async getDeckCandidateCardParameters(
    request: LiveGetDeckCandidateCardParametersRequest,
    options?: RequestOptions,
  ): Promise<LiveGetDeckCandidateCardParametersResponse> {
    await this.ensureAuthenticated();
    return this.client.call(
      LIVE_GET_DECK_CANDIDATE_CARD_PARAMETERS,
      request,
      options,
    );
  }

  /** Calculates deck power for an unsaved candidate deck. @rpc /rpc.api.Live/GetDraftDeckInfo */
  async getDraftDeckInfo(
    request: LiveGetDraftDeckInfoRequest,
    options?: RequestOptions,
  ): Promise<LiveGetDraftDeckInfoResponse> {
    await this.ensureAuthenticated();
    return this.client.call(LIVE_GET_DRAFT_DECK_INFO, request, options);
  }

  /** Returns a saved deck with its evaluation and in-game effects. @rpc /rpc.api.Live/GetDeck */
  async getDeck(
    request: LiveGetDeckRequest,
    options?: RequestOptions,
  ): Promise<LiveGetDeckResponse> {
    await this.ensureAuthenticated();
    return this.client.call(LIVE_GET_DECK, request, options);
  }
}

export {
  LIVE_GET_DECK,
  LIVE_GET_DECK_CANDIDATE_CARD_PARAMETERS,
  LIVE_GET_DRAFT_DECK_INFO,
};
export type {
  LiveActiveSkillLevel,
  LiveDeckCandidateCardParameterInfo,
  LiveDeckEvaluation,
  LiveDeckEvaluationScoreUpPermilUp,
  LiveDeckInGameEffect,
  LiveDeckInGameEffectPosition,
  LiveDeckPosition,
  LiveDeckPositionInput,
  LiveDeckPower,
  LiveGetDeckCandidateCardParametersRequest,
  LiveGetDeckCandidateCardParametersResponse,
  LiveGetDeckRequest,
  LiveGetDeckResponse,
  LiveGetDraftDeckInfoRequest,
  LiveGetDraftDeckInfoResponse,
} from "../codecs/live.js";
