# ADR-052 — Full Editorial Control Center Gate

## Status
Accepted. NA-08 full Editorial Control Center gate is closed.

## Context
NA-08 incrementally introduced the editorial authority model, queue/read model, authenticated private API, identity resolution, private Control Center UI, audited mutation commands, controlled mutation API/UI, durable local persistence, Firestore transactional persistence, official Firestore SDK wiring, and HttpOnly session + CSRF support.

Each layer had deterministic tests, but the architecture still needed one compositional proof that the real boundaries work together and that no UI or transport layer can bypass the authoritative backend rules.

## Decision
`tests/deterministic/orbi-news-editorial-control-center-full-gate.test.ts` is the NA-08 compositional gate.

The test starts a real ephemeral Express server and mounts the real editorial runtime with:

- HMAC-backed HttpOnly editorial session,
- readable CSRF cookie + required CSRF request header,
- real private editorial routes,
- real queue/read service,
- real mutation command service,
- real deterministic role/action authority assessment,
- real State Machine transition checks,
- real audit validation,
- real Firestore persistence adapter,
- an in-memory Firestore contract implementation preserving transactional semantics.

The browser-facing side uses the real `createHttpEditorialControlCenterRepository()` client with same-origin credentials and cookie/CSRF behavior.

## Full gate path

```text
Unauthenticated client
  -> POST /api/editorial/session
  -> HttpOnly identity session + CSRF cookie
  -> GET /api/editorial/queue
  -> organization-scoped queue
  -> action assessment from authoritative snapshot
  -> POST /api/editorial/stories/:storyId/actions
  -> CSRF validation
  -> fresh server-side snapshot
  -> role/action deterministic gate
  -> State Machine-valid mutation patch
  -> AuditLog construction + validation
  -> Firestore transaction
       story mutation + audit append
  -> new revision
  -> refreshed queue
```

## Assertions
The gate proves that:

1. An unauthenticated client has no editorial session.
2. Bootstrap authentication creates an HttpOnly-backed editorial identity without exposing a browser bearer token.
3. Queue reads are scoped to the authenticated actor's organization.
4. A story from another organization is not returned and is not mutated.
5. The client derives available actions from backend-provided deterministic assessments rather than granting authority itself.
6. `APPROVE_STORY` is accepted only from a fresh revision and an allowed authoritative snapshot.
7. Cookie-backed mutations require the CSRF token.
8. The mutation changes `READY_FOR_REVIEW -> APPROVED` through the real mutation command layer.
9. Firestore writes the story mutation and AuditLog within one transaction boundary.
10. The audit identifies the authenticated human actor, organization, action, state transition, and supplied human reason.
11. The successful mutation returns a new revision and the refreshed queue moves the story into `APPROVED`.
12. A stale retry using the pre-mutation revision returns conflict and does not append a second AuditLog.

## Authority invariants
This gate does not change the constitutional authority model:

- UI rendering is never publication or mutation authority.
- Session authentication establishes identity, not permission.
- Role permission is necessary but insufficient.
- `assessEditorialControlAction()` remains the deterministic action gate.
- State Machine transitions remain authoritative.
- Editorial Gate / Breaking Eligibility remain authoritative inputs to action assessment.
- Fresh server-side revision is authoritative over the browser's cached view.
- Firestore persistence cannot upgrade an unauthorized request into an authorized mutation.
- Mutation and audit are one atomic persistence operation.
- Organization identity is derived from the authenticated server-side actor, never from request-body identity fields.

## CI gate
GitHub Actions run `33003777809` for commit `db21b864415495feb0eef1b9b767b298e46ef836` completed successfully:

- dependency installation: PASS,
- TypeScript validation: PASS,
- ORBI News deterministic tests: PASS.

Therefore the full compositional test is covered by the repository's authoritative CI workflow.

## Consequences
NA-08 can now be considered functionally closed as the ORBI News Editorial Control Center foundation.

Production activation still requires deployment-time secrets, Google Cloud IAM/Application Default Credentials, Firestore project/database configuration, and the eventual production hosting decision. Those are infrastructure/deployment concerns rather than missing Editorial Control Center authority logic.

The next product phase may proceed to NA-09 — Social Distribution Assistant while preserving the same rules: Web-first publication, deterministic readiness, human-in-loop social V1, idempotent delivery, and no autonomous social publishing authority merely because an AI generated content.
