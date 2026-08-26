# ADR-050 — Official Firestore SDK Runtime Wiring

## Status
Accepted and dependency gate completed for NA-08.14B.

## Context
NA-08.14A introduced a provider-neutral Firestore persistence adapter implementing `EditorialQueueReader` and `EditorialMutationUnitOfWork`. Production still needed a deterministic way to construct the official Google Cloud Firestore server client from runtime configuration without leaking credentials into source code or coupling the domain to the SDK.

The repository uses `npm ci` and a committed `package-lock.json`, so the official SDK must be represented consistently in both `package.json` and the lockfile.

## Decision
The server exposes a server-only SDK loader in `server/editorial/firestore-sdk.ts`.

Firestore is disabled unless:

- `ORBI_EDITORIAL_FIRESTORE_ENABLED=true` (or `1`), and
- `ORBI_EDITORIAL_FIRESTORE_PROJECT_ID` is explicitly configured.

Optional:

- `ORBI_EDITORIAL_FIRESTORE_DATABASE_ID` selects a non-default database.

When enabled, the runtime loads the official package `@google-cloud/firestore` from the server project with `node:module.createRequire()`. The client is instantiated with:

- explicit `projectId`,
- optional `databaseId`,
- `ignoreUndefinedProperties: true`.

Credentials are not accepted by this factory. Authentication is delegated to the official SDK and Google Cloud Application Default Credentials / IAM in the trusted server environment.

`mountEditorialPrivateApiIfConfigured()` automatically resolves the configured Firestore client only when no persistence dependency was explicitly injected. Dependency injection therefore remains authoritative for deterministic tests.

## Fail-closed errors

- invalid enabled flag → `EDITORIAL_FIRESTORE_ENABLED_INVALID`
- missing project id → `EDITORIAL_FIRESTORE_PROJECT_ID_REQUIRED`
- package cannot be loaded → `EDITORIAL_FIRESTORE_SDK_NOT_INSTALLED`
- loaded module has an unexpected shape → `EDITORIAL_FIRESTORE_SDK_INVALID`
- Firestore and local JSON configured simultaneously → `EDITORIAL_MULTIPLE_PERSISTENCE_BACKENDS_CONFIGURED`

The private API remains unmounted when `ORBI_EDITORIAL_AUTH_SECRET` is absent, so Firestore is not loaded merely because Firestore environment variables exist.

## Security invariants

1. The browser never receives Google Cloud credentials.
2. No service-account JSON or secret is committed to the repository.
3. The project id is explicit when Firestore is enabled.
4. The official server SDK is used only in trusted server environments.
5. Firestore persistence continues to use the transactional adapter from ADR-049.
6. Local JSON persistence remains forbidden in production.
7. Injected test/development persistence is never silently replaced by environment Firestore.

## Reproducibility gate
The dependency gate is complete:

- `@google-cloud/firestore` is pinned to `9.0.0` in `package.json`;
- `package-lock.json` contains the same root dependency and resolved transitive graph;
- CI continues to use `npm ci` as the authoritative installation path.

No manually fabricated lock metadata is used.

## Runtime activation
No direct change to `server.ts` is required. Its existing call to `mountEditorialPrivateApiIfConfigured(app, process.env)` delegates persistence resolution to `runtime-mount.ts`.

Production activation requires server environment configuration for:

- `ORBI_EDITORIAL_AUTH_SECRET`;
- `ORBI_EDITORIAL_FIRESTORE_ENABLED=true`;
- `ORBI_EDITORIAL_FIRESTORE_PROJECT_ID=<google-cloud-project>`;
- optional `ORBI_EDITORIAL_FIRESTORE_DATABASE_ID=<database>`.

Google Cloud credentials remain outside source code and are resolved by ADC/IAM at runtime.

## Consequences
The application runtime can now activate the official Firestore SDK without changes to the API, UI, state machine, editorial policy, mutation command service, or Firestore transaction adapter. The remaining production work is deployment-side Google Cloud project/IAM/database configuration, not application wiring.
