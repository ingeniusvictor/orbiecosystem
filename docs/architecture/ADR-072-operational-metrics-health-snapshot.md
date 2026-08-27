# ADR-072 — Operational Metrics Aggregator & Health Snapshot

## Status
Accepted — NA-10.8.

## Decision
Operational health is derived deterministically from immutable `OperationalRunRecord` entries. The aggregator is a pure domain function and has no Firestore, provider, scheduler, or publication authority.

## Metrics
The V1 snapshot exposes:
- total, completed, failed, blocked, deferred and skipped runs,
- terminal run count,
- success and failure rates,
- average duration for runs that acquired a lease,
- retry run count/rate (`leaseAttempt > 1`),
- last run, last successful run and last failed run timestamps,
- per-job and per-action outcome counts.

## Rate semantics
`successRate` and `failureRate` use only terminal executions as denominator:

`terminalRuns = COMPLETED + FAILED`.

`BLOCKED`, `DEFERRED`, and `SKIPPED` remain visible operational outcomes but are not handler failures and therefore do not reduce the handler success rate.

When there are no terminal runs, both rates are `null`, not `0`.

## Retry semantics
A retry run is any record with `leaseAttempt > 1`. Retry rate uses runs that acquired a lease as denominator.

## Duration semantics
Average duration is calculated only across runs that acquired a lease. Pre-execution scheduler or authority decisions are not mixed into handler execution latency.

## Authority boundary
Health metrics are observability only. A high success rate, low failure rate, or any other metric cannot enable a capability, bypass a kill switch, raise autonomy, approve content, or authorize publication.
