import assert from "node:assert/strict";

import {
  HolodoriApi,
  HolodoriApiError,
  UserContentCdnApi,
} from "@holodori-net/apis";
import { decodeProtoFields, encryptProto } from "@holodori-net/apis/low-level";
import {
  AuthLoginResponseSchema,
  UserContentCdnGetSignedCookieResponseSchema,
} from "@holodori-net/apis/protos";
import { UserGetResponseSchema } from "@holodori-net/apis/protos/rpc/api/user.gen_pb";
import {
  Http2Transport,
  HttpConnectHttp2Transport,
  SshHttp2Transport,
} from "@holodori-net/apis/transports";

for (const exportedValue of [
  HolodoriApi,
  HolodoriApiError,
  UserContentCdnApi,
  decodeProtoFields,
  encryptProto,
  Http2Transport,
  HttpConnectHttp2Transport,
  SshHttp2Transport,
]) {
  assert.equal(typeof exportedValue, "function");
}

for (const schema of [
  AuthLoginResponseSchema,
  UserGetResponseSchema,
  UserContentCdnGetSignedCookieResponseSchema,
]) {
  assert.equal(typeof schema, "object");
}
