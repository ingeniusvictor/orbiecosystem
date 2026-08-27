# ADR-070 — Operational Metrics & Run Audit Contract

## Status
Accepted — NA-10.6.

## Decision
ORBI autonomous operations MUST emit a deterministic `OperationalRunRecord` for every scheduler attempt, including work that is skipped, blocked, or deferred before a lease is acquired.

The record contains organization, worker, scheduler tick, job/action, scheduler decision, operational-authority decision, exact lease attempt when one was acquired, start/end timestamps, deterministic duration, outcome, and normalized reason codes.

## Authority boundary
Operational run audit is observability, not authority. A recorded `COMPLETED` outcome means the injected handler returned successfully and its execution lease was completed. It does not independently prove editorial, visual, publication, or social eligibility; those gates remain the responsibility of the handler path.

## Lease attempt provenance
The orchestrator exposes the attempt number from the lease object returned by the successful claim. It MUST NOT infer an attempt by re-reading Firestore after execution because the persisted lease could belong to another worker or a later retry.

`SKIPPED`, `BLOCKED`, and `DEFERRED` records have `leaseAttempt = null` because no lease is consumed. Claim failures also retain `null` when no lease was successfully acquired.

## Time semantics
Run duration is derived from UTC start/end instants. `finishedAt < startedAt` is invalid and fails closed. Metrics use duration in milliseconds; editorial display timezone does not alter operational elapsed time.

## Persistence boundary
NA-10.6 defines and produces the audit record but does not persist it. Durable append-only storage and aggregation are a subsequent operational step.

## Privacy / security
Run records contain identifiers and reason codes, not provider secrets, credentials, generated private payloads, or source-document contents.
