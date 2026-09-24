import assert from "node:assert/strict";
import { test } from "vitest";

import {
  encodeBytesField,
  encodeMessage,
  encodeVarintField,
} from "../src/low-level.js";
import {
  COOKING_PUZZLE_GET_RANKING_INFO,
  CookingPuzzleApi,
} from "../src/services/cooking-puzzle.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";

void test("decodes Cooking Puzzle rankings using the shared ranking response", () => {
  const rankInfo = encodeMessage(
    encodeVarintField(1, 2),
    encodeVarintField(2, 7_654n),
  );
  const decoded = COOKING_PUZZLE_GET_RANKING_INFO.decode(
    encodeMessage(encodeVarintField(1, 4), encodeBytesField(2, rankInfo)),
  );
  assert.equal(decoded.selfRank, 4);
  assert.equal(decoded.rankInfos[0]?.rank, 2);
  assert.equal(decoded.rankInfos[0]?.score, 7_654n);
});

void test("uses authenticated cached read policies and forwards request options", async () => {
  const calls: {
    method: { path: string; [key: string]: unknown };
    request: unknown;
    options: unknown;
  }[] = [];
  let authCalls = 0;
  const client = {
    call: (method: never, request: unknown, options: unknown) => {
      calls.push({ method, request, options });
      return Promise.resolve({ selfRank: 0, rankInfos: [] });
    },
  } as never;
  const api = new CookingPuzzleApi(
    authenticatedCaller(client, () => {
      authCalls += 1;
      return Promise.resolve();
    }),
  );
  const options = { timeoutMs: 2_000 };

  await api.getRankingInfo(options);

  assert.equal(authCalls, 1);
  assert.equal(calls[0]?.method.path, "/rpc.api.CookingPuzzle/GetRankingInfo");
  assert.equal(calls[0]?.request, undefined);
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
      requiresMasterVersion: true,
      usesResponseCache: true,
      requiresRequestSignature: false,
    },
  );
});
