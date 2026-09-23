import {
  firstBool,
  firstBytes,
  firstInt32,
  firstInt64,
  firstString,
  firstUint,
  type ProtoValue,
} from "../protobuf.js";
import {
  decodeProtoFields,
  decodeRepeatedMessages,
  encodeMessage,
  encodeStringField,
  requireNonEmpty,
  toSafeNumber,
} from "./common.js";

export interface ProfileGetUserProfileDetailRequest {
  readonly publicUserId: string;
}

export interface ProfileEmblemPosition {
  readonly position: number;
  readonly emblemId: string;
}

export interface ProfileUserProfileInfo {
  readonly name: string;
  readonly level: number;
  readonly message: string;
  readonly parkCharacterId: string;
  readonly fanMarkId: string;
  readonly customPaletteImageUrl: string;
  readonly emblemPositions: readonly ProfileEmblemPosition[];
  readonly loginStatusLastUpdatedTime: bigint;
  readonly customPaletteBackgroundCardPotentialUpgradeCount: number;
  readonly customPaletteBackgroundCardId: string;
  readonly multiGameUnpublishedUserName: string;
  readonly isPublicUserIdPublish: boolean;
  readonly isBasicInfoPublish: boolean;
  readonly isCharacterRankPublish: boolean;
  readonly isLiveResultPublish: boolean;
  readonly isMiniGameResultPublish: boolean;
  readonly isUserInfoPublishInMultiGame: boolean;
  readonly sdCostumeId: string;
  readonly sdCostumeHairAccessoryId: string;
}

export interface ProfileBasicUserInfo {
  readonly publicUserId: string;
  readonly userProfileInfo?: ProfileUserProfileInfo;
}

export interface ProfileHighestLiveDeckPosition {
  readonly position: number;
  readonly cardId: string;
  readonly level: number;
  readonly potentialUpgradeCount: number;
}

export interface ProfileHighestLiveDeckEvaluationLiveDeck {
  readonly characterId: string;
  readonly costumeId: string;
  readonly liveDeckPositions: readonly ProfileHighestLiveDeckPosition[];
  readonly liveDeckEvaluationValue: bigint;
  readonly liveDeckEvaluationRankType: number;
  readonly liveDeckEvaluationRankPlusValue: number;
}

export interface ProfileCharacterLevel {
  readonly characterId: string;
  readonly level: number;
}

export interface ProfileLiveResultInfo {
  readonly musicDifficultyType: number;
  readonly count: number;
}

export interface ProfileMiniGameResultInfo {
  readonly resultType: number;
  readonly value: bigint;
}

export interface ProfileMusicHighestScoreRatingInfo {
  readonly characterId: string;
  readonly value: bigint;
}

export interface ProfileUserProfileDetailInfo {
  readonly publicUserId: string;
  readonly userProfileInfo?: ProfileUserProfileInfo;
  readonly achievementClearCount: number;
  readonly highestLiveDeckEvaluationLiveDeck?: ProfileHighestLiveDeckEvaluationLiveDeck;
  readonly characterLevels: readonly ProfileCharacterLevel[];
  readonly totalMusicHighestScoreRatingValue: bigint;
  readonly liveClearResults: readonly ProfileLiveResultInfo[];
  readonly liveFullComboResults: readonly ProfileLiveResultInfo[];
  readonly liveAllPerfectResults: readonly ProfileLiveResultInfo[];
  readonly miniGameResults: readonly ProfileMiniGameResultInfo[];
  readonly isBlockedUser: boolean;
  readonly friendStatusType: number;
  readonly topMusicHighestScoreRatingInfos: readonly ProfileMusicHighestScoreRatingInfo[];
  readonly comboCardGameAverageRankPercent: number;
  readonly comboCardGameChipDiffTotalQuantity: bigint;
}

export interface ProfileGetUserProfileDetailResponse {
  readonly userProfileDetailInfo?: ProfileUserProfileDetailInfo;
}

export function encodeProfileGetUserProfileDetailRequest(
  request: ProfileGetUserProfileDetailRequest,
): Buffer {
  return encodeMessage(
    encodeStringField(
      1,
      requireNonEmpty(request.publicUserId, "public user ID"),
    ),
  );
}

export function decodeProfileGetUserProfileDetailResponse(
  data: Buffer,
): ProfileGetUserProfileDetailResponse {
  const fields = decodeProtoFields(data);
  const detail = firstBytes(fields, 1);
  return detail === undefined
    ? {}
    : { userProfileDetailInfo: decodeProfileUserProfileDetailInfo(detail) };
}

/** Decodes the shared public user fields embedded in ranking responses. */
export function decodeProfileBasicUserInfo(data: Buffer): ProfileBasicUserInfo {
  const fields = decodeProtoFields(data);
  const profile = firstBytes(fields, 2);
  return {
    publicUserId: firstString(fields, 1) ?? "",
    ...(profile === undefined
      ? {}
      : { userProfileInfo: decodeProfileUserProfileInfo(profile) }),
  };
}

function decodeProfileUserProfileDetailInfo(
  data: Buffer,
): ProfileUserProfileDetailInfo {
  const fields = decodeProtoFields(data);
  const userProfileInfo = firstBytes(fields, 2);
  const highestLiveDeck = firstBytes(fields, 4);
  return {
    publicUserId: firstString(fields, 1) ?? "",
    ...(userProfileInfo === undefined
      ? {}
      : { userProfileInfo: decodeProfileUserProfileInfo(userProfileInfo) }),
    achievementClearCount: readInt32(fields, 3),
    ...(highestLiveDeck === undefined
      ? {}
      : {
          highestLiveDeckEvaluationLiveDeck:
            decodeProfileHighestLiveDeckEvaluationLiveDeck(highestLiveDeck),
        }),
    characterLevels: decodeRepeatedMessages(
      fields,
      5,
      decodeProfileCharacterLevel,
    ),
    totalMusicHighestScoreRatingValue: firstInt64(fields, 6) ?? 0n,
    liveClearResults: decodeRepeatedMessages(
      fields,
      7,
      decodeProfileLiveResultInfo,
    ),
    liveFullComboResults: decodeRepeatedMessages(
      fields,
      8,
      decodeProfileLiveResultInfo,
    ),
    liveAllPerfectResults: decodeRepeatedMessages(
      fields,
      9,
      decodeProfileLiveResultInfo,
    ),
    miniGameResults: decodeRepeatedMessages(
      fields,
      10,
      decodeProfileMiniGameResultInfo,
    ),
    isBlockedUser: firstBool(fields, 11),
    friendStatusType: readNumber(fields, 12),
    topMusicHighestScoreRatingInfos: decodeRepeatedMessages(
      fields,
      13,
      decodeProfileMusicHighestScoreRatingInfo,
    ),
    comboCardGameAverageRankPercent: readInt32(fields, 14),
    comboCardGameChipDiffTotalQuantity: firstInt64(fields, 15) ?? 0n,
  };
}

function decodeProfileUserProfileInfo(data: Buffer): ProfileUserProfileInfo {
  const fields = decodeProtoFields(data);
  return {
    name: firstString(fields, 1) ?? "",
    level: readInt32(fields, 2),
    message: firstString(fields, 3) ?? "",
    parkCharacterId: firstString(fields, 4) ?? "",
    fanMarkId: firstString(fields, 5) ?? "",
    customPaletteImageUrl: firstString(fields, 6) ?? "",
    emblemPositions: decodeRepeatedMessages(
      fields,
      7,
      decodeProfileEmblemPosition,
    ),
    loginStatusLastUpdatedTime: firstInt64(fields, 8) ?? 0n,
    customPaletteBackgroundCardPotentialUpgradeCount: readInt32(fields, 9),
    customPaletteBackgroundCardId: firstString(fields, 10) ?? "",
    multiGameUnpublishedUserName: firstString(fields, 11) ?? "",
    isPublicUserIdPublish: firstBool(fields, 100),
    isBasicInfoPublish: firstBool(fields, 101),
    isCharacterRankPublish: firstBool(fields, 102),
    isLiveResultPublish: firstBool(fields, 103),
    isMiniGameResultPublish: firstBool(fields, 104),
    isUserInfoPublishInMultiGame: firstBool(fields, 105),
    sdCostumeId: firstString(fields, 200) ?? "",
    sdCostumeHairAccessoryId: firstString(fields, 201) ?? "",
  };
}

function decodeProfileEmblemPosition(data: Buffer): ProfileEmblemPosition {
  const fields = decodeProtoFields(data);
  return {
    position: readInt32(fields, 1),
    emblemId: firstString(fields, 2) ?? "",
  };
}

function decodeProfileHighestLiveDeckEvaluationLiveDeck(
  data: Buffer,
): ProfileHighestLiveDeckEvaluationLiveDeck {
  const fields = decodeProtoFields(data);
  return {
    characterId: firstString(fields, 1) ?? "",
    costumeId: firstString(fields, 2) ?? "",
    liveDeckPositions: decodeRepeatedMessages(
      fields,
      3,
      decodeProfileHighestLiveDeckPosition,
    ),
    liveDeckEvaluationValue: firstInt64(fields, 4) ?? 0n,
    liveDeckEvaluationRankType: readNumber(fields, 5),
    liveDeckEvaluationRankPlusValue: readInt32(fields, 6),
  };
}

function decodeProfileHighestLiveDeckPosition(
  data: Buffer,
): ProfileHighestLiveDeckPosition {
  const fields = decodeProtoFields(data);
  return {
    position: readInt32(fields, 1),
    cardId: firstString(fields, 2) ?? "",
    level: readInt32(fields, 3),
    potentialUpgradeCount: readInt32(fields, 4),
  };
}

function decodeProfileCharacterLevel(data: Buffer): ProfileCharacterLevel {
  const fields = decodeProtoFields(data);
  return {
    characterId: firstString(fields, 1) ?? "",
    level: readInt32(fields, 2),
  };
}

function decodeProfileLiveResultInfo(data: Buffer): ProfileLiveResultInfo {
  const fields = decodeProtoFields(data);
  return {
    musicDifficultyType: readNumber(fields, 1),
    count: readInt32(fields, 2),
  };
}

function decodeProfileMiniGameResultInfo(
  data: Buffer,
): ProfileMiniGameResultInfo {
  const fields = decodeProtoFields(data);
  return {
    resultType: readNumber(fields, 1),
    value: firstInt64(fields, 2) ?? 0n,
  };
}

function decodeProfileMusicHighestScoreRatingInfo(
  data: Buffer,
): ProfileMusicHighestScoreRatingInfo {
  const fields = decodeProtoFields(data);
  return {
    characterId: firstString(fields, 1) ?? "",
    value: firstInt64(fields, 2) ?? 0n,
  };
}

function readNumber(fields: Map<number, ProtoValue[]>, field: number): number {
  return toSafeNumber(firstUint(fields, field) ?? 0n, `profile field ${field}`);
}

function readInt32(fields: Map<number, ProtoValue[]>, field: number): number {
  return firstInt32(fields, field) ?? 0;
}
