import assert from "node:assert/strict";
import { test } from "vitest";

import {
  decodeProtoFields,
  encodeVarintField,
  firstInt32,
  firstInt64,
  firstUint,
} from "../src/protobuf.js";

void test("decodes signed int32 and int64 protobuf varints", () => {
  const negativeOne = (1n << 64n) - 1n;
  const fields = decodeProtoFields(encodeVarintField(1, negativeOne));

  assert.equal(firstUint(fields, 1), negativeOne);
  assert.equal(firstInt32(fields, 1), -1);
  assert.equal(firstInt64(fields, 1), -1n);
});

void test("preserves positive signed integer values", () => {
  const fields = decodeProtoFields(encodeVarintField(1, 2_147_483_647));

  assert.equal(firstInt32(fields, 1), 2_147_483_647);
  assert.equal(firstInt64(fields, 1), 2_147_483_647n);
});
