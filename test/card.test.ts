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
  CARD_GET_PARAMETER,
  CARD_GET_PARAMETERS,
  CardApi,
} from "../src/services/card.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";
import { withoutTypeNames } from "./support/without-type-names.js";

function encodeFloat32Field(field: number, value: number): Buffer {
  const bytes = Buffer.alloc(4);
  bytes.writeFloatLE(value, 0);
  return Buffer.concat([Buffer.from([field * 8 + 5]), bytes]);
}

void test("encodes Card/GetParameter card ID", () => {
  const fields = decodeProtoFields(
    CARD_GET_PARAMETER.encode({ cardId: "card-1" }),
  );
  assert.equal(fields.get(1)?.[0]?.toString(), "card-1");
  assert.throws(() => CARD_GET_PARAMETER.encode({ cardId: "" }), /card ID/);
});

void test("decodes Card/GetParameter int64 and fixed32 skill tree fields", () => {
  const response = encodeMessage(
    encodeVarintField(1, 123_456_789_012_345n),
    encodeVarintField(2, 10_000n),
    encodeVarintField(3, 20_000n),
    encodeVarintField(4, 30_000n),
    encodeBytesField(
      5,
      encodeMessage(
        encodeVarintField(1, 100),
        encodeFloat32Field(2, 1.25),
        encodeVarintField(3, 200),
        encodeFloat32Field(4, 2.5),
        encodeVarintField(5, 300),
        encodeFloat32Field(6, 3.75),
      ),
    ),
  );

  assert.deepEqual(withoutTypeNames(CARD_GET_PARAMETER.decode(response)), {
    parameter: 123_456_789_012_345n,
    performance: 10_000n,
    technique: 20_000n,
    sense: 30_000n,
    skillTreeEffect: {
      performanceUp: 100,
      performanceUpPermilUp: 1.25,
      techniqueUp: 200,
      techniqueUpPermilUp: 2.5,
      senseUp: 300,
      senseUpPermilUp: 3.75,
    },
  });
});

void test("decodes Card/GetParameters parameter infos", () => {
  const response = encodeMessage(
    encodeBytesField(
      1,
      encodeMessage(
        encodeStringField(1, "card-1"),
        encodeVarintField(2, 111n),
        encodeVarintField(3, 11n),
        encodeVarintField(4, 22n),
        encodeVarintField(5, 33n),
      ),
    ),
    encodeVarintField(2, 125),
  );

  assert.deepEqual(withoutTypeNames(CARD_GET_PARAMETERS.decode(response)), {
    parameterInfos: [
      {
        cardId: "card-1",
        parameter: 111n,
        performance: 11n,
        technique: 22n,
        sense: 33n,
      },
    ],
    liveDeckPowerPermyriadUpByCardLevelUp: 125,
  });
});

void test("CardApi lazily authenticates both read methods", async () => {
  const calls: string[] = [];
  const client = {
    call: (method: { path: string }, request: unknown) => {
      calls.push(`${method.path}:${JSON.stringify(request)}`);
      return Promise.resolve(
        method.path.endsWith("GetParameter")
          ? {
              parameter: 1n,
              performance: 2n,
              technique: 3n,
              sense: 4n,
            }
          : { parameterInfos: [], liveDeckPowerPermyriadUpByCardLevelUp: 0 },
      );
    },
  };
  let authenticationCalls = 0;
  const api = new CardApi(
    authenticatedCaller(client as never, () => {
      authenticationCalls += 1;
      return Promise.resolve();
    }),
  );

  await api.getParameter("card-1");
  await api.getParameters();

  assert.equal(authenticationCalls, 2);
  assert.deepEqual(calls, [
    '/rpc.api.Card/GetParameter:{"cardId":"card-1"}',
    "/rpc.api.Card/GetParameters:undefined",
  ]);
});

void test("Card methods declare their transport policies", () => {
  for (const method of [CARD_GET_PARAMETER, CARD_GET_PARAMETERS]) {
    assert.equal(method.requiresGameAuth, true);
    assert.equal(method.requiresMasterVersion, true);
    assert.equal(method.usesResponseCache, true);
    assert.equal(method.requiresRequestSignature, false);
  }
});
