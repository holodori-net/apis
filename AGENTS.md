# AGENTS.md

This directory is the standalone TypeScript SDK for the Holodori game API.
Keep it independent from the asset and database pipelines so it can be imported
by other Node.js projects.

## Interface

- Runtime target: Node.js >= 24, ESM, zero runtime dependencies.
- High-level package entrypoint: `src/index.ts`; transports and protocol helpers
  also have the `holodori-apis/transports` and `holodori-apis/low-level`
  subpath exports.
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
protobuf fields required by game APIs. Keep each domain in matching
`src/services/` and `src/codecs/` modules. Add methods through typed descriptors
and the shared unary client, with authentication, master version, response
cache, and request signature policies declared independently.
Add new proxy mechanisms through `ApiTunnelConnector`; do not duplicate TLS,
HTTP/2, authentication, or protobuf behavior inside connectors.
Document each exported service class and public method with a concise JSDoc
summary. Include `@rpc` on direct RPC methods and use `@remarks` for account
state, side effects, or constraints. Regenerate `docs/api-reference.md` after
public API documentation changes.

## Validation

Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and
`pnpm test` after changes. Run `pnpm docs:api:check` when public services or
their JSDoc change. Use `pnpm format` and `pnpm lint:fix` for automated fixes.
Do not stage or commit automatically.
