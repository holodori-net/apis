# holodori-apis

Standalone ESM TypeScript SDK for the Holodori game API.

## Development

```sh
pnpm install
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

## Usage

The SDK requires the app version and the recovered API secret. The secret must
be supplied by the caller and is never read from or written to repository
files.

```ts
import { HolodoriApi } from "holodori-apis";

const api = await HolodoriApi.create({
  appVersion: process.env.HOLODORI_APP_VERSION!,
  apiSecret: process.env.HOLODORI_API_SECRET!,
});

const top = await api.notice.top();
console.log(top.categories);
await api.close();
```

`HolodoriApi.create()` automatically reuses a supplied credential, otherwise
creates an anonymous credential, logs in to obtain a game auth token, and
retrieves the current master version. A caller may supply any of those values
to avoid the corresponding bootstrap request.

The default endpoint is `https://jp.game-hololive-dreams.com`. A custom
`ApiTransport` can be injected for tests or a caller-owned network layer.
`additionalHeaders` accepts caller-owned device metadata such as
`x-app-device-name`; protocol, app identity, session, and request ID headers
remain controlled by the SDK.

The notice client exposes `top`, `listInCategory`, `get`,
`updateCategoryReadTime`, and `updateDetailReadTime`. Notice `startTime` values
are returned as `bigint` to preserve protobuf `int64` precision.

Persist the returned credential and pass it to later client instances to avoid
creating a new anonymous account for every process. Treat the credential, game
auth token, and API secret as sensitive values and do not log them.

## Proxy transports

Pass a transport as the second argument to keep network routing explicit. An
injected transport is caller-owned, so close it separately from the API client.

OpenSSH stdio forwarding requires an installed `ssh` executable and existing
host-key trust. It always uses non-interactive authentication and strict
host-key verification.

```ts
import { HolodoriApi, SshHttp2Transport } from "holodori-apis";

const transport = new SshHttp2Transport({
  target: "tpe",
  configFile: "/home/user/.ssh/config",
  options: ["ConnectTimeout=15"],
});
const api = await HolodoriApi.create(
  {
    appVersion: process.env.HOLODORI_APP_VERSION!,
    apiSecret: process.env.HOLODORI_API_SECRET!,
    credential: process.env.HOLODORI_CREDENTIAL,
  },
  transport,
);

try {
  console.log((await api.notice.top()).categories);
} finally {
  await api.close();
  transport.close();
}
```

HTTP CONNECT supports both HTTP and HTTPS proxy endpoints. URL credentials are
sent as Basic proxy authorization; do not include credentials in logs or error
messages. HTTPS proxies may receive a caller-owned CA through `proxyCa`.

```ts
import { HolodoriApi, HttpConnectHttp2Transport } from "holodori-apis";

const transport = new HttpConnectHttp2Transport({
  proxyUrl: "https://proxy.example:8443",
  headers: { "x-proxy-tenant": "example" },
  // proxyCa: readFileSync("company-proxy-ca.pem"),
});
const api = await HolodoriApi.create(
  {
    appVersion: process.env.HOLODORI_APP_VERSION!,
    apiSecret: process.env.HOLODORI_API_SECRET!,
  },
  transport,
);
// After the API work completes: transport.close();
```

The SDK does not read `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`, or Holodori proxy
environment variables. Future system proxy or SOCKS integrations can implement
`ApiTunnelConnector` and pass it to `new Http2Transport({ connector })` without
changing the game API layer.
