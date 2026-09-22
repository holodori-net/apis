import assert from "node:assert/strict";
import { test } from "vitest";

import {
  type ApiTransport,
  type ApiTransportRequest,
  type ApiTransportResponse,
  decodeProtoFields,
  decryptProto,
  encodeBytesField,
  encodeMessage,
  encodeStringField,
  encodeVarintField,
  encryptProto,
  HolodoriApi,
} from "../src/index.js";

const SECRET = "test-api-secret";

class FakeMigrationTransport implements ApiTransport {
  readonly requests: ApiTransportRequest[] = [];
  private readonly responses = new Map<string, Buffer>();

  respond(path: string, message: Buffer): void {
    this.responses.set(
      path,
      encryptProto(message, SECRET, 638000000000000000n),
    );
  }

  request(request: ApiTransportRequest): Promise<ApiTransportResponse> {
    this.requests.push(request);
    const path = new URL(request.url).pathname;
    const body = request.body ?? Buffer.alloc(0);
    const plaintext = decryptProto(body, SECRET);
    if (path === "/rpc.api.AccountMigration/PrepareMigrationPassword") {
      const fields = decodeProtoFields(plaintext);
      assert.equal(fields.get(1)?.[0]?.toString(), "migration-code");
      assert.equal(fields.get(2)?.[0]?.toString(), "migration-password");
      assert.equal(request.headers?.["x-app-auth-token"], undefined);
      assert.equal(request.headers?.["x-app-master-version"], undefined);
    }
    if (path === "/rpc.api.AccountMigration/Migrate") {
      const fields = decodeProtoFields(plaintext);
      assert.equal(fields.has(1), false);
      assert.equal(fields.get(2)?.[0]?.toString(), "target-public-user");
      assert.equal(fields.get(3)?.[0]?.toString(), "one-time-token");
      assert.equal(request.headers?.["x-app-auth-token"], undefined);
      assert.equal(request.headers?.["x-app-master-version"], undefined);
    }
    if (path === "/rpc.api.Auth/Login") {
      assert.equal(
        decodeProtoFields(plaintext).get(1)?.[0]?.toString(),
        "migrated-credential",
      );
    }
    const response = this.responses.get(path);
    if (!response) throw new Error(`no fake response for ${path}`);
    return Promise.resolve({
      status: 200,
      headers: {},
      trailers: { "grpc-status": "0" },
      body: response,
    });
  }
}

void test("performs password migration and leaves login explicit", async () => {
  const transport = new FakeMigrationTransport();
  const linkedUserInfo = encodeMessage(
    encodeStringField(1, "target-public-user"),
    encodeStringField(2, "Migrated Player"),
    encodeVarintField(3, 42),
    encodeStringField(4, "one-time-token"),
    encodeVarintField(5, 1),
  );
  const linkResult = encodeMessage(
    encodeVarintField(1, 0),
    encodeBytesField(2, linkedUserInfo),
  );
  transport.respond(
    "/rpc.api.AccountMigration/PrepareMigrationPassword",
    encodeMessage(encodeBytesField(1, linkResult)),
  );
  transport.respond(
    "/rpc.api.AccountMigration/Migrate",
    encodeMessage(
      encodeStringField(1, "migrated-credential"),
      encodeStringField(2, "new-migration-code"),
    ),
  );
  transport.respond(
    "/rpc.api.Auth/Login",
    encodeMessage(encodeStringField(1, "migrated-auth-token")),
  );
  transport.respond(
    "/rpc.api.Master/Get",
    encodeMessage(encodeStringField(1, "master-version")),
  );

  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      autoAuthenticate: false,
    },
    transport,
  );
  const result = await api.accountMigration.migrateWithPassword(
    "migration-code",
    "migration-password",
  );

  assert.equal(result.accountMigrationId, "new-migration-code");
  assert.equal(api.getCredential(), "migrated-credential");
  assert.equal(api.getGameAuthToken(), undefined);
  assert.equal(api.getMasterVersion(), undefined);

  await api.authLogin();
  await api.masterGet();
  assert.equal(api.getGameAuthToken(), "migrated-auth-token");
  assert.equal(api.getMasterVersion(), "master-version");
  assert.deepEqual(
    transport.requests.map((request) => new URL(request.url).pathname),
    [
      "/rpc.api.AccountMigration/PrepareMigrationPassword",
      "/rpc.api.AccountMigration/Migrate",
      "/rpc.api.Auth/Login",
      "/rpc.api.Master/Get",
    ],
  );
});

void test("omits an empty previous public user ID from migrate payload", async () => {
  const transport = new FakeMigrationTransport();
  transport.respond(
    "/rpc.api.AccountMigration/Migrate",
    encodeMessage(encodeStringField(1, "migrated-credential")),
  );
  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      autoAuthenticate: false,
    },
    transport,
  );

  await api.accountMigration.migrate(
    "target-public-user",
    "one-time-token",
    "",
  );
  const payload = decryptProto(transport.requests[0]!.body!, SECRET);
  assert.equal(decodeProtoFields(payload).has(1), false);
});

void test("switches official regions after password migration", async () => {
  const transport = new FakeMigrationTransport();
  const linkedUserInfo = encodeMessage(
    encodeStringField(1, "target-public-user"),
    encodeStringField(4, "one-time-token"),
    encodeVarintField(5, 2),
  );
  transport.respond(
    "/rpc.api.AccountMigration/PrepareMigrationPassword",
    encodeMessage(
      encodeBytesField(1, encodeMessage(encodeBytesField(2, linkedUserInfo))),
    ),
  );
  transport.respond(
    "/rpc.api.AccountMigration/Migrate",
    encodeMessage(encodeStringField(1, "migrated-credential")),
  );
  transport.respond(
    "/rpc.api.Auth/Login",
    encodeMessage(encodeStringField(1, "migrated-auth-token")),
  );

  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      autoAuthenticate: false,
    },
    transport,
  );
  await api.accountMigration.migrateWithPassword(
    "migration-code",
    "migration-password",
  );
  await api.auth.login();

  assert.deepEqual(
    transport.requests.map((request) => new URL(request.url).origin),
    [
      "https://jp.game-hololive-dreams.com",
      "https://us.game-hololive-dreams.com",
      "https://us.game-hololive-dreams.com",
    ],
  );
});

void test("keeps custom base URLs unless a region resolver is supplied", async () => {
  const transport = new FakeMigrationTransport();
  transport.respond(
    "/rpc.api.AccountMigration/PrepareMigrationPassword",
    encodeMessage(
      encodeBytesField(
        1,
        encodeMessage(
          encodeBytesField(
            2,
            encodeMessage(
              encodeStringField(1, "target-public-user"),
              encodeStringField(4, "one-time-token"),
              encodeVarintField(5, 2),
            ),
          ),
        ),
      ),
    ),
  );
  transport.respond(
    "/rpc.api.AccountMigration/Migrate",
    encodeMessage(encodeStringField(1, "migrated-credential")),
  );
  transport.respond(
    "/rpc.api.Auth/Login",
    encodeMessage(encodeStringField(1, "migrated-auth-token")),
  );

  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      baseUrl: "https://test.example",
      autoAuthenticate: false,
    },
    transport,
  );
  await api.accountMigration.migrateWithPassword(
    "migration-code",
    "migration-password",
  );
  await api.auth.login();

  assert.deepEqual(
    transport.requests.map((request) => new URL(request.url).origin),
    ["https://test.example", "https://test.example", "https://test.example"],
  );
});

void test("rejects unsupported regions on official endpoints", async () => {
  const transport = new FakeMigrationTransport();
  transport.respond(
    "/rpc.api.AccountMigration/PrepareMigrationPassword",
    encodeMessage(
      encodeBytesField(
        1,
        encodeMessage(
          encodeBytesField(
            2,
            encodeMessage(
              encodeStringField(1, "target-public-user"),
              encodeStringField(4, "one-time-token"),
              encodeVarintField(5, 99),
            ),
          ),
        ),
      ),
    ),
  );
  const api = await HolodoriApi.create(
    {
      appVersion: "1.1.0",
      apiSecret: SECRET,
      autoAuthenticate: false,
    },
    transport,
  );

  await assert.rejects(
    api.accountMigration.migrateWithPassword(
      "migration-code",
      "migration-password",
    ),
    /unsupported migration region 99/,
  );
  assert.equal(transport.requests.length, 1);
});
