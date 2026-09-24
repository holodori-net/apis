import assert from "node:assert/strict";
import { test } from "vitest";

import {
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import {
  COMBO_CARD_GAME_LIST_USER_INFO,
  ComboCardGameApi,
} from "../src/services/combo-card-game.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";
import { withoutTypeNames } from "./support/without-type-names.js";

void test("encodes public user IDs and optional private room ID", () => {
  assert.deepEqual(
    COMBO_CARD_GAME_LIST_USER_INFO.encode({
      publicUserIds: ["user-1", "user-2"],
      privateRoomId: "room-1",
    }),
    encodeMessage(
      encodeStringField(1, "user-1"),
      encodeStringField(1, "user-2"),
      encodeStringField(2, "room-1"),
    ),
  );
  assert.deepEqual(
    COMBO_CARD_GAME_LIST_USER_INFO.encode({ publicUserIds: ["user-1"] }),
    encodeStringField(1, "user-1"),
  );
  assert.throws(
    () => COMBO_CARD_GAME_LIST_USER_INFO.encode({ publicUserIds: [] }),
    /at least one public user ID/,
  );
  assert.throws(
    () => COMBO_CARD_GAME_LIST_USER_INFO.encode({ publicUserIds: [""] }),
    /empty public user IDs/,
  );
});

void test("decodes basic user info, average rank percent, and bigint chip difference", () => {
  const basicUserInfo = encodeMessage(
    encodeStringField(1, "public-42"),
    encodeBytesField(
      2,
      encodeMessage(
        encodeStringField(1, "Player"),
        encodeVarintField(2, 75),
        encodeStringField(4, "character-1"),
      ),
    ),
  );
  const userInfo = encodeMessage(
    encodeBytesField(1, basicUserInfo),
    encodeVarintField(2, 87),
    encodeVarintField(3, 9_007_199_254_740_993n),
  );

  assert.deepEqual(
    withoutTypeNames(
      COMBO_CARD_GAME_LIST_USER_INFO.decode(
        encodeMessage(encodeBytesField(1, userInfo)),
      ),
    ),
    {
      comboCardGameUserInfos: [
        {
          basicUserInfo: {
            publicUserId: "public-42",
            userProfileInfo: {
              name: "Player",
              level: 75,
              message: "",
              parkCharacterId: "character-1",
              fanMarkId: "",
              customPaletteImageUrl: "",
              emblemPositions: [],
              loginStatusLastUpdatedTime: 0n,
              customPaletteBackgroundCardPotentialUpgradeCount: 0,
              customPaletteBackgroundCardId: "",
              multiGameUnpublishedUserName: "",
              isPublicUserIdPublish: false,
              isBasicInfoPublish: false,
              isCharacterRankPublish: false,
              isLiveResultPublish: false,
              isMiniGameResultPublish: false,
              isUserInfoPublishInMultiGame: false,
              sdCostumeId: "",
              sdCostumeHairAccessoryId: "",
            },
          },
          comboCardGameAverageRankPercent: 87,
          comboCardGameChipDiffTotalQuantity: 9_007_199_254_740_993n,
        },
      ],
    },
  );
});

void test("uses ListUserInfo policies and forwards options", async () => {
  const calls: {
    method: { path: string; [key: string]: unknown };
    request: unknown;
    options: unknown;
  }[] = [];
  let authCalls = 0;
  const client = {
    call: (method: never, request: unknown, options: unknown) => {
      calls.push({ method, request, options });
      return Promise.resolve({ comboCardGameUserInfos: [] });
    },
  } as never;
  const api = new ComboCardGameApi(
    authenticatedCaller(client, () => {
      authCalls += 1;
      return Promise.resolve();
    }),
  );
  const request = { publicUserIds: ["public-42"], privateRoomId: "room-1" };
  const options = { timeoutMs: 1_500 };

  await api.listUserInfo(request, options);

  assert.equal(authCalls, 1);
  assert.equal(calls[0]?.method.path, "/rpc.api.ComboCardGame/ListUserInfo");
  assert.equal(calls[0]?.request, request);
  assert.equal(calls[0]?.options, options);
  assert.deepEqual(
    {
      requiresGameAuth: calls[0]?.method.requiresGameAuth,
      requiresMasterVersion: calls[0]?.method.requiresMasterVersion,
      usesResponseCache: calls[0]?.method.usesResponseCache,
      requiresRequestSignature: calls[0]?.method.requiresRequestSignature,
    },
    {
      requiresGameAuth: true,
      requiresMasterVersion: false,
      usesResponseCache: true,
      requiresRequestSignature: false,
    },
  );
});
