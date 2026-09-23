import assert from "node:assert/strict";
import { test } from "vitest";

import { decodeSystemGetSystemInfoResponse } from "../src/codecs/system.js";
import {
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import { SYSTEM_GET_SYSTEM_INFO, SystemApi } from "../src/services/system.js";

void test("decodes system routing, maintenance, and Gacha assets", () => {
  const response = encodeMessage(
    encodeStringField(1, "distribution.example"),
    encodeStringField(2, "api.example"),
    encodeVarintField(3, 4),
    encodeVarintField(4, 12),
    encodeStringField(5, "https://support.example"),
    encodeBytesField(
      8,
      encodeMessage(
        encodeVarintField(1, 1),
        encodeStringField(2, "review-api.example"),
        encodeStringField(3, "review-cdn.example"),
        encodeStringField(4, "review-assets.example"),
        encodeVarintField(5, 2),
        encodeVarintField(6, 3),
      ),
    ),
    encodeBytesField(
      9,
      encodeMessage(
        encodeVarintField(1, 1),
        encodeVarintField(2, 1),
        encodeVarintField(3, 1_700_000_000_000n),
        encodeVarintField(4, 1_700_003_600_000n),
        encodeStringField(5, "Maintenance"),
        encodeStringField(6, "asset-maintenance"),
        encodeStringField(7, "#112233"),
        encodeVarintField(100, 1),
      ),
    ),
    encodeBytesField(
      10,
      encodeMessage(
        encodeStringField(1, "gacha-icon"),
        encodeStringField(2, "promotion-movie"),
        encodeStringField(3, "promotion-image"),
        encodeStringField(4, "gacha-bgm"),
        encodeStringField(5, "gacha-animation"),
        encodeStringField(6, "point-icon"),
        encodeStringField(7, "card-1"),
        encodeStringField(7, "card-2"),
      ),
    ),
    encodeVarintField(11, 2),
    encodeBytesField(12, Buffer.from([1, 3])),
  );

  assert.deepEqual(decodeSystemGetSystemInfoResponse(response), {
    octoDistributionHostName: "distribution.example",
    octoApiHostName: "api.example",
    octoAssetEnvId: 4,
    octoDistributionVersion: 12,
    inquiryApiUrl: "https://support.example",
    reviewInfo: {
      isInReview: true,
      apiHostInReview: "review-api.example",
      octoDistributionHostName: "review-cdn.example",
      octoApiHostName: "review-assets.example",
      octoAssetEnvId: 2,
      octoDistributionVersion: 3,
    },
    maintenanceInfo: {
      isInMaintenance: true,
      isPrerelease: true,
      startTime: 1_700_000_000_000n,
      endTime: 1_700_003_600_000n,
      description: "Maintenance",
      characterAssetId: "asset-maintenance",
      characterColor: "#112233",
      isSkipMaintenance: true,
    },
    titleDownloadGachaAssetInfos: [
      {
        iconAssetId: "gacha-icon",
        promotionMovieAssetId: "promotion-movie",
        promotionImageAssetId: "promotion-image",
        bgmAssetId: "gacha-bgm",
        gachaAnimationAssetId: "gacha-animation",
        gachaPointIconAssetId: "point-icon",
        promotionPickupCardIds: ["card-1", "card-2"],
      },
    ],
    recommendGraphicsQualityType: 2,
    deviceWorkaroundTypes: [1, 3],
  });
});

void test("SystemApi submits the supplied credential without auth policies", async () => {
  let requestBody: Buffer | undefined;
  const api = new SystemApi(
    {
      call: (
        method: { path: string; encode: (request: unknown) => Buffer },
        request: unknown,
      ) => {
        assert.equal(method.path, "/rpc.api.System/GetSystemInfo");
        requestBody = method.encode(request);
        return Promise.resolve({});
      },
    } as never,
    { credentialValue: "session-credential" } as never,
  );

  await api.getSystemInfo("credential-value");

  assert.deepEqual(requestBody, encodeStringField(1, "credential-value"));
  assert.equal(SYSTEM_GET_SYSTEM_INFO.requiresGameAuth, false);
  assert.equal(SYSTEM_GET_SYSTEM_INFO.requiresMasterVersion, false);
  assert.equal(SYSTEM_GET_SYSTEM_INFO.usesResponseCache, false);
  assert.equal(SYSTEM_GET_SYSTEM_INFO.requiresRequestSignature, false);
});

void test("SystemApi defaults to the session credential", async () => {
  let requestBody: Buffer | undefined;
  const api = new SystemApi(
    {
      call: (
        method: { encode: (request: unknown) => Buffer },
        request: unknown,
      ) => {
        requestBody = method.encode(request);
        return Promise.resolve({});
      },
    } as never,
    { credentialValue: "session-credential" } as never,
  );

  await api.getSystemInfo();

  assert.deepEqual(requestBody, encodeStringField(1, "session-credential"));
});
