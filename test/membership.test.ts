import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeProtoFields,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
} from "../src/low-level.js";
import {
  MEMBERSHIP_GET_SHOP,
  MembershipApi,
} from "../src/services/membership.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";

void test("encodes empty Membership/GetShop request", () => {
  assert.equal(MEMBERSHIP_GET_SHOP.encode(undefined).length, 0);
});

void test("decodes Membership/GetShop with shared shop schema", () => {
  const shop = encodeMessage(
    encodeStringField(1, "membership-shop"),
    encodeBytesField(
      2,
      encodeMessage(
        encodeVarintField(1, 2),
        encodeBytesField(
          3,
          encodeMessage(
            encodeStringField(1, "membership-yearly"),
            encodeVarintField(2, 3),
            encodeBytesField(
              4,
              encodeMessage(
                encodeVarintField(1, 2),
                encodeVarintField(4, 1),
                encodeVarintField(6, 1),
                encodeVarintField(7, 500),
                encodeStringField(100, "apple.product"),
                encodeStringField(101, "google.product"),
              ),
            ),
          ),
        ),
      ),
    ),
  );
  const response = MEMBERSHIP_GET_SHOP.decode(encodeBytesField(1, shop));
  assert.equal(response.shop?.id, "membership-shop");
  assert.equal(response.shop?.items[0]?.chargeItem?.id, "membership-yearly");
  assert.equal(
    response.shop?.items[0]?.chargeItem?.subscription?.isSubscribed,
    true,
  );
  assert.equal(
    response.shop?.items[0]?.chargeItem?.subscription?.providePaidStoneQuantity,
    500,
  );
  assert.equal(
    decodeProtoFields(MEMBERSHIP_GET_SHOP.encode(undefined)).size,
    0,
  );
});

void test("MembershipApi authenticates lazily and declares read policies", async () => {
  let authCalls = 0;
  const paths: string[] = [];
  const api = new MembershipApi(
    authenticatedCaller(
      {
        call: (method: { path: string }) => {
          paths.push(method.path);
          return Promise.resolve({ id: "membership-shop" });
        },
      } as never,
      () => {
        authCalls += 1;
        return Promise.resolve();
      },
    ),
  );
  await api.getShop();
  assert.equal(authCalls, 1);
  assert.deepEqual(paths, ["/rpc.api.Membership/GetShop"]);
  assert.equal(MEMBERSHIP_GET_SHOP.requiresGameAuth, true);
  assert.equal(MEMBERSHIP_GET_SHOP.requiresMasterVersion, true);
  assert.equal(MEMBERSHIP_GET_SHOP.usesResponseCache, true);
  assert.equal(MEMBERSHIP_GET_SHOP.requiresRequestSignature, false);
});
