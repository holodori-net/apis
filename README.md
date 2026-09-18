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
