import assert from "node:assert/strict";
import { test } from "vitest";

import { decodeProtobuf, encodeProtobuf } from "../src/protos/codec.js";
import {
  SystemGetSystemInfoRequestSchema,
  SystemGetSystemInfoResponseSchema,
} from "../src/protos/gen/rpc/api/system.gen_pb.js";
import { SYSTEM_GET_SYSTEM_INFO, SystemApi } from "../src/services/system.js";

void test("decodes the complete system routing and maintenance response", () => {
  const response = encodeProtobuf(SystemGetSystemInfoResponseSchema, {
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

  const decoded = SYSTEM_GET_SYSTEM_INFO.decode(response);
  assert.equal(decoded.octoDistributionHostName, "distribution.example");
  assert.equal(decoded.reviewInfo?.octoApiHostName, "review-assets.example");
  assert.equal(decoded.maintenanceInfo?.startTime, 1_700_000_000_000n);
  assert.equal(decoded.maintenanceInfo?.isSkipMaintenance, true);
  assert.deepEqual(
    decoded.titleDownloadGachaAssetInfos[0]?.promotionPickupCardIds,
    ["card-1", "card-2"],
  );
  assert.deepEqual(decoded.deviceWorkaroundTypes, [1, 3]);
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

  assert.equal(
    decodeProtobuf(SystemGetSystemInfoRequestSchema, requestBody!).credential,
    "credential-value",
  );
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

  assert.equal(
    decodeProtobuf(SystemGetSystemInfoRequestSchema, requestBody!).credential,
    "session-credential",
  );
});
