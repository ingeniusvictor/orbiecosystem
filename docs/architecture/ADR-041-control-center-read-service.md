# ADR-041 — Editorial Control Center Read Service

## Status
Accepted for NA-08.6.

## Decision
The private Editorial Control Center receives its queue through a read-only application service. The service depends on an `EditorialQueueReader`, derives queue items with domain policy, and returns role-aware action assessments.

## Boundary

```text
Persistence / future adapter
        ↓
EditorialQueueReader
        ↓
ControlCenterReadService
        ↓
Editorial Queue View Model
        ↓
Future private API / UI
```

The reader returns internal `EditorialQueueSource` records. It does not return pre-authorized buttons or precomputed UI policy.

## Role handling
The requested authenticated role is passed to the read service and then into the deterministic queue builder. This produces action assessments appropriate to the role while preserving all state-machine and gate checks.

Authentication itself is intentionally deferred to a later NA-08 step. Until that boundary exists, no HTTP route for this service is exposed.

## Invariants
1. The read service performs no mutation.
2. It cannot approve, reject, schedule, publish or mark Breaking.
3. Queue filters are presentation filters only.
4. An empty reader returns an empty queue rather than synthetic editorial records.
5. Action assessments are derived on every read; they are not persisted as authority.
6. Any future mutation endpoint must independently re-evaluate authorization and deterministic gates.

## CI
The ORBI News workflow now watches `server/**` so private editorial application services are included in TypeScript validation and deterministic tests.

## Deferred
Authentication/session resolution, private HTTP endpoints, persistence-backed readers, React Control Center screens and audited mutation commands remain future NA-08 work.
