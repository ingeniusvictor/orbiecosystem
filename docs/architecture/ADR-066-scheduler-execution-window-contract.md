# ADR-066 — Scheduler & Execution Window Contract

Status: ACCEPTED

## Context
ORBI News requires deterministic execution windows for discovery, social digests, and breaking handling without allowing the scheduler to become a publication authority.

## Decision
V1 scheduling policy is defined in `domain/operations/scheduler.ts`.

- Editorial timezone: `America/Santiago`.
- Discovery radar cadence: hourly (`60` minutes).
- Web publication daily target ceiling: `8` per editorial day. Enforcement remains an operational authority/budget concern.
- Social digest windows: `09:00` and `18:00` editorial local time.
- Breaking social work may bypass digest timing only when upstream breaking eligibility is already true.
- Breaking never bypasses verification, editorial, visual, social readiness, operational authority, kill switches, capabilities, or publication policy.

## Idempotency
Each scheduler evaluation produces a deterministic tick key:

`<JOB>:<EDITORIAL_DATE>:<LOCAL_HOUR>`

A completed tick key is treated as `DUPLICATE_TICK`. Multiple workers observing the same hour therefore converge on one scheduler identity instead of creating distinct executions.

## Authority boundary
Scheduler decisions are only:

- `DUE`
- `DUE_BREAKING`
- `NOT_DUE`
- `DUPLICATE_TICK`

`DUE` and `DUE_BREAKING` mean only that timing permits an attempt. They do not grant authority to discover, generate, email, publish, or distribute.

NA-10.1 operational authority must still return `ALLOW`, and all upstream domain gates remain independently authoritative.

## Time semantics
Stored timestamps remain UTC. Execution windows are derived at evaluation time using `America/Santiago`, preventing UTC clock values from accidentally redefining the editorial day or digest hour.

## Non-goals
This ADR does not add a cron provider, Cloud Scheduler, queue worker, Firestore execution lease, email delivery, or automatic social publication.
