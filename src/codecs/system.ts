import {
  firstBool,
  firstString,
  firstUint,
  type ProtoValue,
} from "../protocol/protobuf.js";
import {
  decodeProtoFields,
  encodeCredentialRequest,
  isBuffer,
  toSafeNumber,
} from "./common.js";

export interface SystemGetSystemInfoResponse {
  readonly octoDistributionHostName: string;
  readonly octoApiHostName: string;
  readonly octoAssetEnvId: number;
  readonly octoDistributionVersion: number;
  readonly inquiryApiUrl: string;
  readonly reviewInfo?: SystemReviewInfo;
  readonly maintenanceInfo?: SystemMaintenanceInfo;
  readonly titleDownloadGachaAssetInfos: readonly SystemGachaAssetInfo[];
  readonly recommendGraphicsQualityType: number;
  readonly deviceWorkaroundTypes: readonly number[];
}

export interface SystemReviewInfo {
  readonly isInReview: boolean;
  readonly apiHostInReview: string;
  readonly octoDistributionHostName: string;
  readonly octoApiHostName: string;
  readonly octoAssetEnvId: number;
  readonly octoDistributionVersion: number;
}

export interface SystemMaintenanceInfo {
  readonly isInMaintenance: boolean;
  readonly isPrerelease: boolean;
  readonly startTime: bigint;
  readonly endTime: bigint;
  readonly description: string;
  readonly characterAssetId: string;
  readonly characterColor: string;
  readonly isSkipMaintenance: boolean;
}

export interface SystemGachaAssetInfo {
  readonly iconAssetId: string;
  readonly promotionMovieAssetId: string;
  readonly promotionImageAssetId: string;
  readonly bgmAssetId: string;
  readonly gachaAnimationAssetId: string;
  readonly gachaPointIconAssetId: string;
  readonly promotionPickupCardIds: readonly string[];
}

export function encodeSystemGetSystemInfoRequest(credential: string): Buffer {
  return encodeCredentialRequest(credential);
}

export function decodeSystemGetSystemInfoResponse(
  data: Buffer,
): SystemGetSystemInfoResponse {
  const fields = decodeProtoFields(data);
  const reviewInfo = (fields.get(8) ?? []).find(isBuffer);
  const maintenanceInfo = (fields.get(9) ?? []).find(isBuffer);
  return {
    octoDistributionHostName: firstString(fields, 1) ?? "",
    octoApiHostName: firstString(fields, 2) ?? "",
    octoAssetEnvId: asNumber(fields, 3, "Octo asset environment ID"),
    octoDistributionVersion: asNumber(fields, 4, "Octo distribution version"),
    inquiryApiUrl: firstString(fields, 5) ?? "",
    ...(reviewInfo === undefined
      ? {}
      : { reviewInfo: decodeReviewInfo(reviewInfo) }),
    ...(maintenanceInfo === undefined
      ? {}
      : { maintenanceInfo: decodeMaintenanceInfo(maintenanceInfo) }),
    titleDownloadGachaAssetInfos: (fields.get(10) ?? [])
      .filter(isBuffer)
      .map(decodeGachaAssetInfo),
    recommendGraphicsQualityType: asNumber(
      fields,
      11,
      "recommended graphics quality type",
    ),
    deviceWorkaroundTypes: (fields.get(12) ?? []).flatMap((value) =>
      typeof value === "bigint"
        ? [toSafeNumber(value, "device workaround type")]
        : decodePackedInt32(value, "device workaround type"),
    ),
  };
}

function decodeReviewInfo(data: Buffer): SystemReviewInfo {
  const fields = decodeProtoFields(data);
  return {
    isInReview: firstBool(fields, 1),
    apiHostInReview: firstString(fields, 2) ?? "",
    octoDistributionHostName: firstString(fields, 3) ?? "",
    octoApiHostName: firstString(fields, 4) ?? "",
    octoAssetEnvId: asNumber(fields, 5, "review Octo asset environment ID"),
    octoDistributionVersion: asNumber(
      fields,
      6,
      "review Octo distribution version",
    ),
  };
}

function decodeMaintenanceInfo(data: Buffer): SystemMaintenanceInfo {
  const fields = decodeProtoFields(data);
  return {
    isInMaintenance: firstBool(fields, 1),
    isPrerelease: firstBool(fields, 2),
    startTime: firstUint(fields, 3) ?? 0n,
    endTime: firstUint(fields, 4) ?? 0n,
    description: firstString(fields, 5) ?? "",
    characterAssetId: firstString(fields, 6) ?? "",
    characterColor: firstString(fields, 7) ?? "",
    isSkipMaintenance: firstBool(fields, 100),
  };
}

function decodeGachaAssetInfo(data: Buffer): SystemGachaAssetInfo {
  const fields = decodeProtoFields(data);
  return {
    iconAssetId: firstString(fields, 1) ?? "",
    promotionMovieAssetId: firstString(fields, 2) ?? "",
    promotionImageAssetId: firstString(fields, 3) ?? "",
    bgmAssetId: firstString(fields, 4) ?? "",
    gachaAnimationAssetId: firstString(fields, 5) ?? "",
    gachaPointIconAssetId: firstString(fields, 6) ?? "",
    promotionPickupCardIds: (fields.get(7) ?? [])
      .filter(isBuffer)
      .map((value) => value.toString("utf8")),
  };
}

function asNumber(
  fields: Map<number, ProtoValue[]>,
  field: number,
  name: string,
): number {
  return toSafeNumber(firstUint(fields, field) ?? 0n, name);
}

function decodePackedInt32(data: Buffer, name: string): readonly number[] {
  const values: number[] = [];
  let offset = 0;
  while (offset < data.length) {
    let value = 0n;
    let shift = 0n;
    while (true) {
      const byte = data[offset++];
      if (byte === undefined || shift > 63n)
        throw new Error("malformed packed protobuf varint");
      value |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7n;
    }
    values.push(toSafeNumber(value, name));
  }
  return values;
}
