# ADR-048 — Durable Local Editorial Persistence

## Status
Accepted for NA-08.13 development persistence. Not approved as the production multi-instance backend.

## Context
The editorial Control Center now has authenticated reads, audited mutation commands, optimistic concurrency and a mutation API. The repository does not currently include Firestore, SQL or another transactional cloud database client, so production persistence cannot be truthfully claimed yet.

## Decision
Introduce `createJsonEditorialPersistence()` as a dependency-free durable adapter implementing both:

- `EditorialQueueReader`
- `EditorialMutationUnitOfWork`

The adapter stores organization-scoped editorial queue sources and immutable audit entries in one versioned JSON state file.

## Atomic commit
A mutation commit is serialized by a process-local write lock and performs:

1. re-read latest durable state;
2. verify `expectedRevision`;
3. apply the deterministic mutation patch;
4. generate a new opaque revision;
5. append the AuditLog entry;
6. write the complete next state to a temporary file;
7. atomically rename the temporary file over the active store.

The mutation and audit entry therefore become visible together or not at all within this adapter's supported single-process model.

## Tenant isolation
Editorial sources are partitioned under organization keys. Both read and mutation lookup require `organizationId`; a story in another organization is not returned or mutated.

## Runtime opt-in
The local store is enabled only when `ORBI_EDITORIAL_LOCAL_STORE_FILE` is explicitly configured. Authentication still requires `ORBI_EDITORIAL_AUTH_SECRET`.

If `NODE_ENV=production`, configuring the local file store throws `EDITORIAL_LOCAL_STORE_FORBIDDEN_IN_PRODUCTION`.

## Why production is blocked
A process-local mutex and filesystem rename do not provide safe distributed transactions across multiple Vercel/Cloud Run instances, and ephemeral/serverless filesystems are not a durable shared database. Therefore this adapter must not be used as the production source of truth.

## Production replacement boundary
A Firestore or SQL adapter can later implement the same `EditorialQueueReader` and `EditorialMutationUnitOfWork` contracts. The domain gates, HTTP API, React client and audit command layer do not need to change.

## Invariants
- no unscoped editorial read;
- no mutation without revision check;
- mutation and audit are committed together;
- stale revisions produce `REVISION_CONFLICT`;
- audit entries are append-only inside successful commits;
- no automatic retry after revision conflict;
- local file persistence is forbidden in production.
