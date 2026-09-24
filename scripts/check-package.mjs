import assert from "node:assert/strict";

import { HolodoriApi, HolodoriApiError } from "@holodori/apis";
import { decodeProtoFields, encryptProto } from "@holodori/apis/low-level";
import {
  Http2Transport,
  HttpConnectHttp2Transport,
  SshHttp2Transport,
} from "@holodori/apis/transports";

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
