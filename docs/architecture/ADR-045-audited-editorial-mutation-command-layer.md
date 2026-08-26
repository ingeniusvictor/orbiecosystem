# ADR-045 — Audited Editorial Mutation Command Layer

## Status
Accepted for NA-08.10.

## Context
The Editorial Control Center now exposes deterministic action assessments, an authenticated private read boundary, an HMAC-backed identity resolver and a read-only private UI. The next requirement is to execute editorial mutations without allowing the browser, role alone, ORBI score, or stale UI state to become publication authority.

A mutation must also never succeed without an immutable audit record. Performing the entity update and audit append as independent writes would allow partial success.

## Decision
Introduce an `EditorialMutationCommandService` with the following authority chain:

1. authenticated actor supplies `organizationId`, `actorId` and `EditorialRole`;
2. command service loads a fresh mutation record scoped to the actor organization;
3. optional client revision is compared with the fresh revision;
4. `assessEditorialControlAction()` is executed against the fresh snapshot;
5. the requested action is converted to a deterministic state/flag patch;
6. the resulting `AuditLogEntry` is validated before persistence;
7. a single `EditorialMutationUnitOfWork.commitMutation()` must atomically persist both mutation and audit entry using the fresh revision as an optimistic concurrency guard;
8. a revision conflict is surfaced as concurrent modification and never reported as success.

## Atomicity contract
`EditorialMutationUnitOfWork` is deliberately stronger than two separate repository calls. Its implementation must guarantee that entity mutation and audit append commit together or neither commits.

Future database adapters should implement this boundary with a database transaction or equivalent atomic mechanism.

## Optimistic concurrency
Every mutable record has a persistence revision opaque to the domain. The service loads that revision and sends it back as `expectedRevision` during commit. If the record changes after the fresh read, the commit returns `REVISION_CONFLICT` and the caller must reload before retrying.

A client may additionally provide the revision it observed. A stale client revision is rejected before mutation.

## Action mapping
- `REQUEST_REVISION` → Canonical Story `DRAFTING`, only when the canonical State Machine allows it.
- `APPROVE_STORY` → Canonical Story `APPROVED`.
- `REJECT_STORY` → Canonical Story `REJECTED`.
- `MARK_BREAKING` → `isBreaking=true` only after Breaking Eligibility + Editorial Gate authorization.
- `UNMARK_BREAKING` → `isBreaking=false`.
- `PREPARE_WEB_PUBLICATION` → `READY` when valid; otherwise `SCHEDULED` when that is the valid preparation transition.
- `PUBLISH_WEB_NOW` → Publication `PUBLISHING`; final `PUBLISHED` remains the responsibility of the publication execution/result layer.

No action mapping may bypass `assessEditorialControlAction()` or the canonical State Machine.

## Audit
Every successful mutation carries one human `AuditLogEntry` in the same atomic commit. State transitions record `fromState` and `toState`; Breaking flag changes are audited without fabricating a state-machine transition.

The audit record includes the editorial action, actor role, correlation identifier and optional human reason.

## Explicit non-goals
NA-08.10 does not:
- expose mutation HTTP routes;
- enable buttons in the React UI;
- implement persistence;
- implement publication completion or retry workers;
- auto-retry revision conflicts;
- allow AI actors to provide final human approval.

Those integrations must consume this command service rather than reimplementing authority.
