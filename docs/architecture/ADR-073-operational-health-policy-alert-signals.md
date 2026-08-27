# ADR-073 — Operational Health Policy & Alert Signals

## Status
Accepted — NA-10.9

## Decision
Operational health is derived deterministically from `OperationalHealthSnapshot` plus recent immutable `OperationalRunRecord` history. Health signals are observability and safety inputs only; they are never publication authority.

## V1 health states
- `HEALTHY`
- `DEGRADED`
- `CRITICAL`

## V1 thresholds
Rate thresholds require at least 4 terminal runs (`COMPLETED + FAILED`).

- Failure rate >= 25% → degraded.
- Failure rate >= 50% → critical.
- Retry rate >= 30% → degraded.
- Retry rate >= 60% → critical.
- 3 consecutive terminal failures → degraded.
- 5 consecutive terminal failures → critical.
- >= 6 hours since last successful run, when prior activity exists → degraded.
- >= 24 hours since last successful run, when prior activity exists → critical.

`BLOCKED`, `DEFERRED`, and `SKIPPED` are not handler failures and do not create a failure streak.

## Autonomy safety boundary
Health policy may recommend an autonomy ceiling only:
- `DEGRADED` → recommend at most `LEVEL_3`.
- `CRITICAL` → recommend at most `LEVEL_1`.
- `HEALTHY` → no recommendation.

The assessment does not mutate `AutonomyLevel`, toggle automation, clear kill switches, or authorize any operation. In particular, a health signal can be used later to reduce autonomy, but can never raise autonomy automatically.

## Precedence
Any critical signal yields `CRITICAL`. Otherwise any degraded signal yields `DEGRADED`; otherwise the result is `HEALTHY`.

## Rationale
Operational metrics need deterministic interpretation so repeated failures, retry pressure, or stale successful execution can be surfaced before autonomous operation becomes unsafe. Keeping the policy separate from authority prevents observability from becoming an accidental permission source.
