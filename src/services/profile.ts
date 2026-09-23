import {
  decodeProfileGetUserProfileDetailResponse,
  encodeProfileGetUserProfileDetailRequest,
  type ProfileGetUserProfileDetailRequest,
  type ProfileGetUserProfileDetailResponse,
} from "../codecs/profile.js";
import { type ApiClient } from "../core/client.js";
import { type ApiMethod } from "../core/method.js";
import { type RequestOptions } from "../core/request-options.js";

const PROFILE_GET_USER_PROFILE_DETAIL: ApiMethod<
  ProfileGetUserProfileDetailRequest,
  ProfileGetUserProfileDetailResponse
> = {
  path: "/rpc.api.Profile/GetUserProfileDetail",
  requiresGameAuth: true,
  requiresMasterVersion: false,
  usesResponseCache: true,
  requiresRequestSignature: false,
  encode: encodeProfileGetUserProfileDetailRequest,
  decode: decodeProfileGetUserProfileDetailResponse,
};

/** Reads a player's public profile and gameplay summary. */
export class ProfileApi {
  constructor(
    private readonly client: ApiClient,
    private readonly ensureAuthenticated: () => Promise<unknown>,
  ) {}

  /**
   * Returns visible profile details and public play statistics for a user.
   * @rpc /rpc.api.Profile/GetUserProfileDetail
   * @remarks Returned fields follow the target user's profile publication settings.
   */
  async getUserProfileDetail(
    request: ProfileGetUserProfileDetailRequest,
    options?: RequestOptions,
  ): Promise<ProfileGetUserProfileDetailResponse> {
    await this.ensureAuthenticated();
    return this.client.call(PROFILE_GET_USER_PROFILE_DETAIL, request, options);
  }
}

export { PROFILE_GET_USER_PROFILE_DETAIL };
export type {
  ProfileBasicUserInfo,
  ProfileCharacterLevel,
  ProfileEmblemPosition,
  ProfileGetUserProfileDetailRequest,
  ProfileGetUserProfileDetailResponse,
  ProfileHighestLiveDeckEvaluationLiveDeck,
  ProfileHighestLiveDeckPosition,
  ProfileLiveResultInfo,
  ProfileMiniGameResultInfo,
  ProfileMusicHighestScoreRatingInfo,
  ProfileUserProfileDetailInfo,
  ProfileUserProfileInfo,
} from "../codecs/profile.js";
