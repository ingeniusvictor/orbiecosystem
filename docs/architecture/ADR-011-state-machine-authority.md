# ADR-011 — State Machine Authority

## Status
Accepted for ORBI News Intelligence NA-01.8.

## Context
ORBI News contains multiple entities with independent lifecycle states: NewsItem, CanonicalStory and PublicationRecord. Allowing arbitrary status assignment would let agents, retries or integration code skip required verification, review or publication gates.

## Decision
All lifecycle changes must be validated by deterministic state machines before persistence.

The language model may recommend an action, but it may not directly mutate persisted lifecycle status without passing the relevant transition validator.

## Governed State Machines
- NewsItem lifecycle
- CanonicalStory lifecycle
- PublicationRecord lifecycle

## Required Properties
1. A transition must be explicitly allow-listed.
2. Self-transitions are rejected.
3. Terminal states expose no outbound transition unless the domain explicitly supports superseding or recovery.
4. Invalid transitions return `INVALID_STATE_TRANSITION` with machine, source state and target state.
5. State validation occurs before the repository persists the new status.
6. Policy checks remain separate from lifecycle checks. A transition can be structurally valid but still be blocked by verification, editorial or publication policy.

## Examples
Invalid:
- `INGESTED -> PUBLISHED`
- `VERIFYING -> APPROVED`
- `DRAFTING -> PUBLISHED`
- `NOT_SCHEDULED -> PUBLISHED`
- `PUBLISHED -> PUBLISHING`

Valid examples:
- `INGESTED -> VERIFYING`
- `VERIFYING -> VERIFIED`
- `VERIFIED -> SCORED`
- `READY_FOR_REVIEW -> APPROVED`
- `READY -> PUBLISHING`
- `PUBLISHING -> PUBLISHED`

## Recovery
Recovery from FAILED or BLOCKED states is explicit and limited. Recovery does not mean arbitrary rollback. Every permitted recovery transition must still pass the current policy gates.

## Consequence
ORBI News gains a deterministic lifecycle authority independent of AI output and external integration behavior.
