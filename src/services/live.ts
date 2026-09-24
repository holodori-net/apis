import type { DescMessage } from "@bufbuild/protobuf";

import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import {
  decodeProtobuf,
  encodeProtobuf,
  type ProtobufMessageInit,
} from "../protos/codec.js";
import {
  type LiveDeckPositionSchema as LiveDeckPositionSchemaType,
  LiveGetDeckCandidateCardParametersRequestSchema,
  type LiveGetDeckCandidateCardParametersResponse,
  LiveGetDeckCandidateCardParametersResponseSchema,
  LiveGetDeckRequestSchema,
  type LiveGetDeckResponse,
  LiveGetDeckResponseSchema,
  LiveGetDraftDeckInfoRequestSchema,
  type LiveGetDraftDeckInfoResponse,
  LiveGetDraftDeckInfoResponseSchema,
} from "../protos/gen/rpc/api/live.gen_pb.js";

type RequiredInit<
  Schema extends DescMessage,
  Keys extends keyof ProtobufMessageInit<Schema>,
> = Required<Pick<ProtobufMessageInit<Schema>, Keys>> &
  ProtobufMessageInit<Schema>;

export type LiveDeckPositionInput = RequiredInit<
  typeof LiveDeckPositionSchemaType,
  "cardId" | "position"
>;
export type LiveGetDeckCandidateCardParametersRequest = RequiredInit<
  typeof LiveGetDeckCandidateCardParametersRequestSchema,
  "characterId" | "costumeId"
>;
export type LiveGetDraftDeckInfoRequest = RequiredInit<
  typeof LiveGetDraftDeckInfoRequestSchema,
  "characterId" | "costumeId" | "deckPositions"
> & { readonly deckPositions: readonly LiveDeckPositionInput[] };
export type LiveGetDeckRequest = RequiredInit<
  typeof LiveGetDeckRequestSchema,
  "characterId" | "number"
>;

const LIVE_GET_DECK_CANDIDATE_CARD_PARAMETERS: ApiMethod<
  LiveGetDeckCandidateCardParametersRequest,
  LiveGetDeckCandidateCardParametersResponse
> = {
  path: "/rpc.api.Live/GetDeckCandidateCardParameters",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) => {
    requireNonEmpty(request.characterId, "character ID");
    requireNonEmpty(request.costumeId, "costume ID");
    return encodeProtobuf(
      LiveGetDeckCandidateCardParametersRequestSchema,
      request,
    );
  },
  decode: (data) =>
    decodeProtobuf(LiveGetDeckCandidateCardParametersResponseSchema, data),
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
  encode: (request) => {
    requireNonEmpty(request.characterId, "character ID");
    requireNonEmpty(request.costumeId, "costume ID");
    if (request.deckPositions.length > 5) {
      throw new RangeError("deck positions must contain at most five entries");
    }
    for (const position of request.deckPositions) {
      if (
        !Number.isInteger(position.position) ||
        position.position < 1 ||
        position.position > 5
      ) {
        throw new RangeError(
          "deck position must be an integer from one to five",
        );
      }
      requireNonEmpty(position.cardId, "card ID");
    }
    return encodeProtobuf(LiveGetDraftDeckInfoRequestSchema, request);
  },
  decode: (data) => decodeProtobuf(LiveGetDraftDeckInfoResponseSchema, data),
};

const LIVE_GET_DECK: ApiMethod<LiveGetDeckRequest, LiveGetDeckResponse> = {
  path: "/rpc.api.Live/GetDeck",
  requiresGameAuth: true,
  requiresMasterVersion: true,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) => {
    requireNonEmpty(request.characterId, "character ID");
    if (!Number.isInteger(request.number) || request.number < 1) {
      throw new RangeError("deck number must be a positive integer");
    }
    return encodeProtobuf(LiveGetDeckRequestSchema, request);
  },
  decode: (data) => decodeProtobuf(LiveGetDeckResponseSchema, data),
};

/** Evaluates candidate and saved live decks with the game server's formulas. */
export class LiveApi {
  constructor(private readonly client: ApiCaller) {}

  /** Evaluates owned cards for a character, costume, and optional song. @rpc /rpc.api.Live/GetDeckCandidateCardParameters */
  async getDeckCandidateCardParameters(
    request: LiveGetDeckCandidateCardParametersRequest,
    options?: RequestOptions,
  ): Promise<LiveGetDeckCandidateCardParametersResponse> {
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
    return this.client.call(LIVE_GET_DRAFT_DECK_INFO, request, options);
  }

  /** Returns a saved deck with its evaluation and in-game effects. @rpc /rpc.api.Live/GetDeck */
  async getDeck(
    request: LiveGetDeckRequest,
    options?: RequestOptions,
  ): Promise<LiveGetDeckResponse> {
    return this.client.call(LIVE_GET_DECK, request, options);
  }
}

function requireNonEmpty(value: string, name: string): void {
  if (value.length === 0) throw new TypeError(`${name} must not be empty`);
}

export {
  LIVE_GET_DECK,
  LIVE_GET_DECK_CANDIDATE_CARD_PARAMETERS,
  LIVE_GET_DRAFT_DECK_INFO,
};
export type {
  LiveDeckInGameEffect_LiveActiveSkillLevel as LiveActiveSkillLevel,
  LiveDeckEvaluation,
  LiveDeckEvaluation_LiveDeckEvaluationScoreUpPermilUp as LiveDeckEvaluationScoreUpPermilUp,
  LiveDeckInGameEffect,
  LiveDeckInGameEffect_LiveDeckPosition as LiveDeckInGameEffectPosition,
  LiveDeckPosition,
  LiveDeckEvaluation_LiveDeckPower as LiveDeckPower,
} from "../protos/gen/rpc/api/common/live.gen_pb.js";
export type {
  LiveGetDeckCandidateCardParametersResponse,
  LiveGetDeckResponse,
  LiveGetDraftDeckInfoResponse,
} from "../protos/gen/rpc/api/live.gen_pb.js";
export type { LiveGetDeckCandidateCardParametersResponse_ParameterInfo as LiveDeckCandidateCardParameterInfo } from "../protos/gen/rpc/api/live.gen_pb.js";
