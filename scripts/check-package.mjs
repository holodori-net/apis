import assert from "node:assert/strict";

import { HolodoriApi, HolodoriApiError } from "@holodori-net/apis";
import { decodeProtoFields, encryptProto } from "@holodori-net/apis/low-level";
import { AuthLoginResponseSchema } from "@holodori-net/apis/protos";
import { UserGetResponseSchema } from "@holodori-net/apis/protos/rpc/api/user.gen_pb";
import {
  Http2Transport,
  HttpConnectHttp2Transport,
  SshHttp2Transport,
} from "@holodori-net/apis/transports";

for (const exportedValue of [
  HolodoriApi,
  HolodoriApiError,
  decodeProtoFields,
  encryptProto,
  Http2Transport,
  HttpConnectHttp2Transport,
  SshHttp2Transport,
]) {
  assert.equal(typeof exportedValue, "function");
}

for (const schema of [AuthLoginResponseSchema, UserGetResponseSchema]) {
  assert.equal(typeof schema, "object");
}
