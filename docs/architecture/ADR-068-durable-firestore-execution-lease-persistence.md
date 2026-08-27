# ADR-068 — Durable Firestore Execution Lease Persistence

## Status
Accepted — NA-10.4

## Context
NA-10.2 introduced deterministic scheduler tick keys and NA-10.3 introduced an execution lease contract. A process-local lease is insufficient in production because multiple workers or Cloud Run instances can observe the same scheduler tick concurrently.

## Decision
Persist execution leases in Firestore using one document per organization and scheduler tick key:

`orbiOperationalOrganizations/{organizationId}/executionLeases/{tickKey}`

The tick key is the document identity. This makes one scheduler slot converge on one durable record.

Every claim, complete, and fail mutation is performed inside a Firestore transaction and delegates state semantics to the NA-10.3 domain functions.

## Rules
1. The first claim creates and claims the document atomically.
2. A second worker reading an active claim receives `EXECUTION_LEASE_ALREADY_CLAIMED`.
3. A replay by the same active owner is idempotent and does not consume another attempt.
4. A different worker may take over only after lease expiry.
5. `COMPLETED` is terminal and cannot be reclaimed.
6. `FAILED` may be reclaimed only while `attempt < maxAttempts`.
7. Complete/fail require the active owner inside the same transaction.
8. Malformed persisted records fail closed; they are never silently replaced.
9. Identical tick keys in different organizations remain isolated.
10. Firestore persistence does not grant operational authority and does not decide whether the scheduler tick is due.

## Authority chain
`Scheduler due` → `Operational authority ALLOW` → `Durable lease claim` → execution → `complete/fail lease`.

A successful lease claim means only that one worker owns the execution attempt. It does not bypass any verification, editorial, visual, publication, or social gate.

## Collection boundary
Operational leases use `orbiOperationalOrganizations`, separate from the editorial persistence root `orbiEditorialOrganizations`.

## Authentication
The implementation reuses the server-side `@google-cloud/firestore` client and therefore inherits ADC/IAM authentication. No credentials are stored in the repository or exposed to the browser.

## Consequences
- Cloud Run workers can coordinate scheduler work through Firestore transactions.
- Scheduler idempotency survives process restarts.
- Retry attempts persist across instances.
- Firestore transaction semantics become a production dependency for autonomous execution.
- A future runtime adapter still needs to wire scheduler ticks and leases into actual worker execution.
