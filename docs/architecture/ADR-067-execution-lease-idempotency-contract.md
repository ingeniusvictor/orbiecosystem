# ADR-067 — Execution Lease & Idempotency Contract

## Status
Accepted — NA-10.3.

## Context
A deterministic scheduler tick key prevents replay after completion but does not prevent two workers from observing the same uncompleted tick at the same time. ORBI News needs a separate ownership contract so only one worker can execute a scheduled unit of work.

## Decision
Each executable scheduler tick is represented by an `ExecutionLease` keyed to the scheduler `tickKey`.

Lease states:
- `AVAILABLE`
- `CLAIMED`
- `COMPLETED`
- `FAILED`
- `EXPIRED` (derived when an active claim reaches `expiresAt`)

The canonical path is:

`AVAILABLE -> CLAIMED -> COMPLETED`

Failure and recovery:

`CLAIMED -> FAILED -> CLAIMED`

An active claim can also become effectively `EXPIRED`; only after expiry may another worker reclaim it.

## Invariants
1. One live lease has one owner.
2. Another worker cannot claim a non-expired `CLAIMED` lease.
3. Reclaim by the same owner while active is idempotent and does not increment attempts.
4. A different worker may reclaim only after expiry.
5. Each new claim increments `attempt`.
6. Attempts cannot exceed the explicit `maxAttempts` budget.
7. Only the active owner may complete or fail a lease.
8. A worker cannot complete an expired claim.
9. `COMPLETED` is terminal and cannot be reclaimed.
10. Lease acquisition does not grant operational or editorial authority; NA-10.1 and all downstream gates still apply.

## Persistence boundary
NA-10.3 defines the pure domain contract only. Durable atomic compare-and-set/transactional storage will be added separately. Correct distributed execution requires the persistence adapter to create/claim/update a lease atomically.

## Consequences
The scheduler now has a deterministic concurrency model that can later be backed by Firestore transactions without changing scheduler semantics. A tick key is the identity of work; the lease is temporary execution ownership.
