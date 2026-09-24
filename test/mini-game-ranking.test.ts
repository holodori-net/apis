import assert from "node:assert/strict";
import { test } from "vitest";

import {
  encodeBytesField,
  encodeMessage,
  encodeVarintField,
} from "../src/low-level.js";
import { ChaseTeamType as GeneratedChaseTeamType } from "../src/protos/gen/enums/chase_team_type.gen_pb.js";
import { CHASE_GET_RANKING_INFO, ChaseApi } from "../src/services/chase.js";
import { CircuitApi } from "../src/services/circuit.js";
import { ComboCardGameApi } from "../src/services/combo-card-game.js";
import { JumpRopeApi } from "../src/services/jump-rope.js";
import { SplashBallApi } from "../src/services/splash-ball.js";
import { authenticatedCaller } from "./support/authenticated-caller.js";

void test("encodes mini-game ranking requests according to their contracts", () => {
  assert.deepEqual(
    CHASE_GET_RANKING_INFO.encode({
      chaseTeamType: GeneratedChaseTeamType.MISCHIEF,
    }),
    encodeMessage(encodeVarintField(1, 1)),
  );
  assert.deepEqual(
    CHASE_GET_RANKING_INFO.encode({
      chaseTeamType: GeneratedChaseTeamType.PATROL,
    }),
    encodeMessage(encodeVarintField(1, 2)),
  );
  assert.throws(
    () => CHASE_GET_RANKING_INFO.encode({ chaseTeamType: 0 }),
    /chaseTeamType/,
  );
});

void test("decodes self rank and shared basic rank information", () => {
  const rankInfo = encodeMessage(
    encodeVarintField(1, 3),
    encodeVarintField(2, 1_234_567n),
  );
  const response = CHASE_GET_RANKING_INFO.decode(
    encodeMessage(encodeVarintField(1, 5), encodeBytesField(2, rankInfo)),
  );

  assert.equal(response.selfRank, 5);
  assert.equal(response.rankInfos[0]?.rank, 3);
  assert.equal(response.rankInfos[0]?.score, 1_234_567n);
});

void test("uses authenticated, cached read policies and forwards options", async () => {
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
  const authenticate = () => {
    authCalls += 1;
    return Promise.resolve();
  };
  const caller = authenticatedCaller(client, authenticate);
  const jumpRope = new JumpRopeApi(caller);
  const circuit = new CircuitApi(caller);
  const chase = new ChaseApi(caller);
  const splashBall = new SplashBallApi(caller);
  const comboCardGame = new ComboCardGameApi(caller);
  const options = { timeoutMs: 2_000 };

  await jumpRope.getRankingInfo(options);
  await circuit.getRankingInfo(options);
  await chase.getRankingInfo(
    { chaseTeamType: GeneratedChaseTeamType.PATROL },
    options,
  );
  await splashBall.getRankingInfo(options);
  await comboCardGame.getRankingInfo(options);

  assert.equal(authCalls, 5);
  assert.deepEqual(
    calls.map(({ method }) => method.path),
    [
      "/rpc.api.JumpRope/GetRankingInfo",
      "/rpc.api.Circuit/GetRankingInfo",
      "/rpc.api.Chase/GetRankingInfo",
      "/rpc.api.SplashBall/GetRankingInfo",
      "/rpc.api.ComboCardGame/GetRankingInfo",
    ],
  );
  assert.deepEqual(
    calls.map(({ request }) => request),
    [
      undefined,
      undefined,
      { chaseTeamType: GeneratedChaseTeamType.PATROL },
      undefined,
      undefined,
    ],
  );
  assert.ok(calls.every(({ options: callOptions }) => callOptions === options));
  assert.ok(
    calls.every(
      ({ method }) =>
        method.requiresGameAuth === true &&
        method.requiresMasterVersion === true &&
        method.usesResponseCache === true &&
        method.requiresRequestSignature === false,
    ),
  );
});
