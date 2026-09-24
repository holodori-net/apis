import { type ApiCaller } from "../core/caller.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";
import {
  decodeProtobuf,
  encodeProtobuf,
  type ProtobufMessageInit,
} from "../protos/codec.js";
import {
  ProfileGetUserProfileDetailRequestSchema,
  type ProfileGetUserProfileDetailResponse,
  ProfileGetUserProfileDetailResponseSchema,
} from "../protos/gen/rpc/api/profile.gen_pb.js";

export type ProfileGetUserProfileDetailRequest = Required<
  Pick<
    ProtobufMessageInit<typeof ProfileGetUserProfileDetailRequestSchema>,
    "publicUserId"
  >
>;

const PROFILE_GET_USER_PROFILE_DETAIL: ApiMethod<
  ProfileGetUserProfileDetailRequest,
  ProfileGetUserProfileDetailResponse
> = {
  path: "/rpc.api.Profile/GetUserProfileDetail",
  requiresGameAuth: true,
  requiresMasterVersion: false,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: (request) => {
    if (!request.publicUserId)
      throw new TypeError("public user ID must not be empty");
    return encodeProtobuf(ProfileGetUserProfileDetailRequestSchema, request);
  },
  decode: (data) =>
    decodeProtobuf(ProfileGetUserProfileDetailResponseSchema, data),
};

/** Reads a player's public profile and gameplay summary. */
export class ProfileApi {
  constructor(private readonly client: ApiCaller) {}

  /**
   * Returns visible profile details and public play statistics for a user.
   * @rpc /rpc.api.Profile/GetUserProfileDetail
   * @remarks Returned fields follow the target user's profile publication settings.
   */
  async getUserProfileDetail(
    request: ProfileGetUserProfileDetailRequest,
    options?: RequestOptions,
  ): Promise<ProfileGetUserProfileDetailResponse> {
    return this.client.call(PROFILE_GET_USER_PROFILE_DETAIL, request, options);
  }
}

export { PROFILE_GET_USER_PROFILE_DETAIL };
export type { EmblemPosition as ProfileEmblemPosition } from "../protos/gen/common/emblem_position.gen_pb.js";
export type {
  BasicUserInfo as ProfileBasicUserInfo,
  UserProfileDetailInfo_CharacterLevel as ProfileCharacterLevel,
  UserProfileDetailInfo_HighestLiveDeckEvaluationLiveDeck as ProfileHighestLiveDeckEvaluationLiveDeck,
  UserProfileDetailInfo_HighestLiveDeckEvaluationLiveDeck_LiveDeckPosition as ProfileHighestLiveDeckPosition,
  UserProfileDetailInfo_LiveResultInfo as ProfileLiveResultInfo,
  UserProfileDetailInfo_MiniGameResultInfo as ProfileMiniGameResultInfo,
  UserProfileDetailInfo_MusicHighestScoreRatingInfo as ProfileMusicHighestScoreRatingInfo,
  UserProfileDetailInfo as ProfileUserProfileDetailInfo,
  UserProfileInfo as ProfileUserProfileInfo,
} from "../protos/gen/rpc/api/common/profile.gen_pb.js";
export type { ProfileGetUserProfileDetailResponse } from "../protos/gen/rpc/api/profile.gen_pb.js";
