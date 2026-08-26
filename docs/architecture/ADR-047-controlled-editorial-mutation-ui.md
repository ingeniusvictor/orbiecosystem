# ADR-047 — Controlled Editorial Mutation UI

## Status
Accepted for NA-08.12.

## Decision
The private Editorial Control Center may invoke authenticated editorial mutation commands only when the current queue read model reports the corresponding `EditorialActionAssessment.allowed === true`.

The browser is never authoritative. Every mutation is re-validated server-side by the authenticated mutation API and mutation command service.

## Optimistic concurrency
`EditorialQueueSource` and `EditorialQueueItem` must carry an opaque, non-empty `revision` supplied by persistence/read-model infrastructure.

The UI sends exactly the revision it observed as `expectedRevision`. It must not derive or increment revisions locally.

HTTP 409 means the observed state is stale or changed concurrently. The UI refreshes the queue and requires the operator to reconsider the action against the new state.

## Authentication
The same injected `EditorialTokenProvider` is used for read and mutation calls.

The mutation body contains only:
- action
- expectedRevision
- optional human reason

It never sends authoritative actorId, organizationId or role fields.

## Confirmation
All mutations require explicit operator confirmation in the UI.

`PUBLISH_WEB_NOW` uses reinforced confirmation text explaining that the server will re-check role, state, gates and revision before publication begins.

## Failure behavior
- 401: authentication/session problem
- 403: deterministic authority denial
- 409: stale/concurrent state; refresh required
- 503: mutation persistence not configured; no change occurred
- other failure: no mutation success is assumed

A successful mutation causes a queue refresh so the UI never continues operating from the pre-mutation snapshot.

## Runtime safety
The current production composition still has no real `EditorialMutationUnitOfWork` wired into `server.ts`. Therefore mutation requests remain fail-closed with HTTP 503 until transactional persistence is deliberately configured.

## Non-goals
NA-08.12 does not add a login page, database, automatic publication provider, retry loop or autonomous editorial approval.
