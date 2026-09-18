# AGENTS.md

This directory is the standalone TypeScript SDK for the Holodori game API.
Keep it independent from the asset and database pipelines so it can be imported
by other Node.js projects.

## Interface

- Runtime target: Node.js >= 24, ESM, zero runtime dependencies.
- Public package entrypoint: `src/index.ts`; package exports point to the built
  `dist/src/index.js` and declaration file.
- Transport is injectable for deterministic tests and offline consumers.
- `Http2Transport` owns target TLS and HTTP/2 behavior; tunnel connectors own
  only the raw route to the target host and port.
- Built-in proxy transports are explicit and never read proxy environment
  variables. OpenSSH remains non-interactive and HTTP CONNECT credentials must
  stay redacted from errors.
- Credentials, API secrets, auth tokens, and raw response bodies must not be
  logged or committed.

## Scope

Protocol helpers implement HTTP/2, gRPC framing, proto-enc encryption, and the
protobuf fields required by Auth, Master, and Notice APIs. Add new API methods
through typed request/response codecs and the shared unary request path.
Add new proxy mechanisms through `ApiTunnelConnector`; do not duplicate TLS,
HTTP/2, authentication, or protobuf behavior inside connectors.

## Validation

Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and
`pnpm test` after changes. Use `pnpm format` and `pnpm lint:fix` for automated
fixes. Do not stage or commit automatically.
