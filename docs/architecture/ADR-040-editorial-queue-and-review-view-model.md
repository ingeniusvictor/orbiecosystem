# ADR-040 — Editorial Queue and Review View Model

## Status
Accepted for NA-08.5.

## Decision
The Editorial Control Center consumes a deterministic queue view model derived from canonical story state, publication state, integrated editorial authority and the role-based control gate.

The queue does not own editorial truth and does not introduce a second workflow state machine.

## Derived buckets
- `NEEDS_REVIEW`
- `BLOCKED`
- `APPROVED`
- `SCHEDULED`
- `PUBLISHING`
- `PUBLISHED`
- `FAILED`
- `DRAFTING`

Buckets are presentation-oriented derivatives of canonical states. They are not persisted authorities.

## Attention model
Each queue item exposes `requiresHumanAttention` and deterministic `attentionReasons`. Elevated risk, editorial blocks, human-review requirements and publication failures are surfaced explicitly instead of being inferred by UI styling.

## Action model
Every queue row receives an assessment for every `EditorialControlAction`:

- `allowed`
- `reasons[]`

The UI may hide or disable unavailable actions, but it must not recalculate authority itself. Backend execution must re-evaluate the same deterministic gates before mutation.

## Ordering
Default priority is:

1. blocked
2. failed
3. needs review
4. approved
5. scheduled
6. publishing
7. drafting
8. published

Within a bucket, higher ORBI score sorts first; ties use the most recent `updatedAt`.

This ordering is an operational attention policy, not publication authority.

## Invariants
1. A queue bucket never overrides canonical state.
2. A queue position never grants permission.
3. `VIEWER` receives complete assessments but no mutable action.
4. Blocking/review reasons remain visible to operators.
5. Published items may remain visible for audit/history but rank after active work by default.
6. Filters operate only on the derived view model and do not mutate workflow state.

## Deferred
Authentication, persistence-backed queue readers, mutation endpoints and the React Control Center UI remain for later NA-08 steps.
