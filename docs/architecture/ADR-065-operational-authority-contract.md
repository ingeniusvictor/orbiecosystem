# ADR-065 — Operational Authority Contract

## Status
Accepted for NA-10.1.

## Context
NA-09 closed the deterministic social distribution chain. NA-10 introduces orchestration, but autonomous execution must never become a new publication authority.

The system already defines `SystemMode`, `AutonomyLevel`, capabilities and downstream editorial/publication/social gates. What was missing was one fail-closed contract that decides whether orchestration may ATTEMPT an operation.

## Decision
Create `domain/operations/operational-authority.ts` as the deterministic operational authority layer.

It defines:

- operational actions for discovery, verification, generation, scheduling, web publishing, social preparation, email delivery and platform publishing;
- explicit automation toggles;
- kill-switch scopes;
- operational daily budgets;
- retry budgets;
- deterministic `ALLOW / DEFER / BLOCK` decisions.

## Precedence

1. `EMERGENCY_STOP` -> `BLOCK`.
2. Matching kill switch -> `BLOCK`.
3. `READ_ONLY` or `MAINTENANCE` prevents mutating operations -> `DEFER`.
4. Disabled automation toggle -> `DEFER`.
5. Insufficient autonomy -> `DEFER`.
6. Capability not `AVAILABLE` -> `DEFER`.
7. Daily limit exhausted -> `DEFER`.
8. Retry budget exhausted -> `DEFER`.
9. Only a fully satisfied snapshot -> `ALLOW`.

`NOT_CONFIGURED` is the default for omitted capabilities.

## Autonomy floors

- discovery: LEVEL_1
- verification: LEVEL_2
- drafting/image/social preparation: LEVEL_3
- scheduling/email delivery: LEVEL_4
- autonomous publication: LEVEL_5

LEVEL_5 alone grants nothing. Toggles, capabilities, kill switches, modes, budgets and all downstream gates remain authoritative.

## System modes

`READ_ONLY` and `MAINTENANCE` may continue read/research operations such as discovery and verification, but do not permit mutating operations.

`EMERGENCY_STOP` blocks every operational action.

## Kill switches

Scopes include:

- GLOBAL
- ALL_PUBLISHING
- FACEBOOK
- INSTAGRAM
- NEWS_DISCOVERY
- AI_GENERATION
- IMAGE_GENERATION
- EMAIL_DELIVERY

A scoped switch only blocks its governed operations; for example, FACEBOOK does not block Instagram.

## Non-authority statement
An `ALLOW` result means only that orchestration may attempt the operation. It does not authorize factual claims, state transitions, publication, delivery or persistence.

Existing verification, editorial, visual, publication, social readiness, state-machine, revision, audit and persistence rules remain mandatory.

## Out of scope
NA-10.1 does not implement:

- a scheduler runtime;
- queue persistence;
- distributed locks;
- retries/backoff execution;
- observability;
- provider calls;
- autonomous web/social publication.

Those are subsequent NA-10 phases.
