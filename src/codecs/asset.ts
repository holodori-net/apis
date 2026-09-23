import { decodeProtoFields, encodeEmpty, isBuffer } from "./common.js";

export interface AssetListExpiredAssetIdResponse {
  readonly homeBanner?: ExpiredAssetIdList;
  readonly parkBanner?: ExpiredAssetIdList;
  readonly event?: ExpiredEventAssetIds;
  readonly marathon?: ExpiredEventAssetIds;
  readonly loginBonus?: ExpiredLoginBonusAssetIds;
  readonly shop?: ExpiredShopAssetIds;
  readonly startupNotification?: ExpiredAssetIdList;
  readonly gacha?: ExpiredGachaAssetIds;
}

export interface ExpiredAssetIdList {
  readonly assetIds: readonly string[];
}

export interface ExpiredEventAssetIds {
  readonly logoAssetIds: readonly string[];
  readonly backgroundAssetIds: readonly string[];
}

export interface ExpiredLoginBonusAssetIds extends ExpiredEventAssetIds {
  readonly thumbnailAssetIds: readonly string[];
}

export interface ExpiredShopAssetIds {
  readonly thumbnailAssetIds: readonly string[];
}

export interface ExpiredGachaAssetIds {
  readonly iconAssetIds: readonly string[];
  readonly promotionImageAssetIds: readonly string[];
  readonly promotionMovieAssetIds: readonly string[];
  readonly bgmAssetIds: readonly string[];
  readonly gachaAnimationAssetIds: readonly string[];
}

export function encodeAssetListExpiredAssetIdRequest(): Buffer {
  return encodeEmpty();
}

export function decodeAssetListExpiredAssetIdResponse(
  data: Buffer,
): AssetListExpiredAssetIdResponse {
  const fields = decodeProtoFields(data);
  const homeBanner = firstMessage(fields, 1);
  const parkBanner = firstMessage(fields, 2);
  const event = firstMessage(fields, 3);
  const marathon = firstMessage(fields, 4);
  const loginBonus = firstMessage(fields, 5);
  const shop = firstMessage(fields, 6);
  const startupNotification = firstMessage(fields, 7);
  const gacha = firstMessage(fields, 8);

  return {
    ...(homeBanner === undefined
      ? {}
      : { homeBanner: { assetIds: stringList(homeBanner, 1) } }),
    ...(parkBanner === undefined
      ? {}
      : { parkBanner: { assetIds: stringList(parkBanner, 1) } }),
    ...(event === undefined
      ? {}
      : {
          event: {
            logoAssetIds: stringList(event, 1),
            backgroundAssetIds: stringList(event, 2),
          },
        }),
    ...(marathon === undefined
      ? {}
      : {
          marathon: {
            logoAssetIds: stringList(marathon, 1),
            backgroundAssetIds: stringList(marathon, 2),
          },
        }),
    ...(loginBonus === undefined
      ? {}
      : {
          loginBonus: {
            logoAssetIds: stringList(loginBonus, 1),
            backgroundAssetIds: stringList(loginBonus, 2),
            thumbnailAssetIds: stringList(loginBonus, 3),
          },
        }),
    ...(shop === undefined
      ? {}
      : { shop: { thumbnailAssetIds: stringList(shop, 1) } }),
    ...(startupNotification === undefined
      ? {}
      : {
          startupNotification: { assetIds: stringList(startupNotification, 1) },
        }),
    ...(gacha === undefined
      ? {}
      : {
          gacha: {
            iconAssetIds: stringList(gacha, 1),
            promotionImageAssetIds: stringList(gacha, 2),
            promotionMovieAssetIds: stringList(gacha, 3),
            bgmAssetIds: stringList(gacha, 4),
            gachaAnimationAssetIds: stringList(gacha, 5),
          },
        }),
  };
}

function firstMessage(
  fields: ReturnType<typeof decodeProtoFields>,
  fieldNumber: number,
): ReturnType<typeof decodeProtoFields> | undefined {
  const value = (fields.get(fieldNumber) ?? []).find(isBuffer);
  return value === undefined ? undefined : decodeProtoFields(value);
}

function stringList(
  fields: ReturnType<typeof decodeProtoFields>,
  fieldNumber: number,
): string[] {
  return (fields.get(fieldNumber) ?? [])
    .filter(isBuffer)
    .map((value) => value.toString("utf8"));
}
