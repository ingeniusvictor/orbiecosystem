# ADR-049 — Firestore Editorial Persistence Adapter

## Status
Accepted for NA-08.14A.

## Context
The Editorial Control Center requires a production-capable persistence backend that implements both `EditorialQueueReader` and `EditorialMutationUnitOfWork`. The local JSON adapter introduced in ADR-048 is durable for one local process but is explicitly unsuitable for horizontally scaled production runtimes.

The repository currently does not contain `@google-cloud/firestore`, and `npm ci` is governed by the existing lockfile. Updating that large lockfile through partial remote edits risks unrelated dependency churn, so SDK installation and runtime instantiation are separated from the persistence adapter itself.

## Decision
Implement `createFirestoreEditorialPersistence()` against a minimal Firestore-compatible server interface. The adapter is compatible with the transaction, collection, document, query snapshot, and document snapshot operations used by the official Node server SDK.

The adapter implements:

- `EditorialQueueReader`
- `EditorialMutationUnitOfWork`
- organization-scoped audit reads

The runtime mount accepts an injected Firestore-compatible client and derives both the read and mutation dependencies from the same persistence instance.

## Firestore layout

```text
orbiEditorialOrganizations/{organizationId}
  /stories/{storyId}
  /audit/{auditLogId}
```

Each story document stores the full `EditorialQueueSource`, including the opaque optimistic-concurrency `revision`.

## Atomic mutation rule
A mutation uses one Firestore transaction:

1. read the organization-scoped story document;
2. reject missing or malformed documents;
3. compare persisted `revision` with `expectedRevision`;
4. generate a new opaque revision;
5. stage the updated story document;
6. `create()` the immutable audit document;
7. allow Firestore to atomically commit both writes.

If the revision conflicts, no writes are staged. If the transaction fails, neither story nor audit is committed.

Audit uses `create()` rather than overwrite semantics so reusing an AuditLog ID fails closed.

## Tenant boundary
Both story and audit paths are nested under `organizationId`. The ID is obtained from the authenticated actor by the private API and is never selected by the browser request body.

## Runtime selection
`mountEditorialPrivateApiIfConfigured()` accepts an injected `firestore` client. It rejects simultaneous configuration of Firestore and the local JSON file backend.

The local JSON backend remains forbidden when `NODE_ENV=production`.

## Dependency installation split
NA-08.14 is intentionally split:

- **NA-08.14A:** Firestore transactional adapter, runtime injection contract, deterministic tests.
- **NA-08.14B:** install `@google-cloud/firestore`, regenerate `package-lock.json` in a controlled package-manager environment, instantiate the official `Firestore` client using Application Default Credentials / runtime IAM, and wire it into `server.ts`.

No CI reproducibility rule is weakened to accelerate SDK installation.

## Invariants

- Firestore is a persistence authority, not an editorial policy authority.
- A high score cannot bypass role, gate, state-machine, or revision checks.
- Mutation and audit are committed atomically.
- A revision conflict never retries the human editorial command automatically.
- AuditLog IDs are immutable/create-only.
- Cross-organization reads and mutations are structurally isolated by document path.
- The JSON local adapter is not promoted to production.

## Non-goals

- Provisioning a Google Cloud project or Firestore database.
- Creating service-account keys.
- Shipping credentials in source code.
- Changing the publication state machine.
- Installing the official SDK without a reproducible lockfile update.
