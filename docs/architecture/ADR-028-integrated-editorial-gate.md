# ADR-028 — Integrated Editorial Gate

## Status
Accepted for NA-05.9.

## Context
ORBI News already has separate deterministic authorities for verification, event intelligence, editorial scoring and canonical story validation. None of those signals is sufficient on its own to authorize editorial progression.

A high editorial score must not override weak verification, unresolved event state, contradictory evidence, critical risk or an invalid grounding contract.

## Decision
Introduce `evaluateIntegratedEditorialGate` as the deterministic authority that decides whether a canonical story can advance beyond editorial preparation.

The gate returns exactly one of:

- `ALLOW_EDITORIAL`
- `REQUIRE_HUMAN_REVIEW`
- `DEFER`
- `BLOCK`

## Inputs
The gate consumes:

- a `CanonicalStory`;
- the deterministic `VerificationGateResult`;
- current `EventStatus`;
- whether the event has contradictory evidence;
- a grounding assessment for the canonical story.

It also derives the ORBI editorial band from the stored ORBI score and invokes the existing canonical story policy.

## Precedence
### BLOCK
Block takes precedence when any of the following applies:

- canonical-story grounding is invalid;
- verification gate returns `BLOCK`;
- story risk is `CRITICAL`;
- event status is `INVALID`;
- canonical story policy blocks the story;
- ORBI editorial band is `REJECT`.

### DEFER
Defer when the content is not yet ready rather than unsafe:

- verification gate returns `DEFER`;
- event is `DETECTED` or `CONSOLIDATING`;
- ORBI editorial band is `HOLD`.

### REQUIRE_HUMAN_REVIEW
Human review is required when:

- the event has contradictory evidence;
- event status is `DISPUTED`;
- verification requires human review;
- canonical story policy requires human review.

### ALLOW_EDITORIAL
Allow only after all blocking, deferral and review conditions have been excluded and verification explicitly returns `ALLOW_EDITORIAL_PIPELINE`.

## Invariants
1. ORBI Editorial Score is not publication authority.
2. A score of 100 cannot override grounding or verification failures.
3. Contradicted or disputed events cannot advance autonomously.
4. `HOLD` means wait/defer, not reject.
5. Critical risk is never downgraded by editorial relevance.
6. AI may propose copy and scoring inputs but cannot set the final integrated editorial decision.
7. This gate authorizes progression within the editorial pipeline; it does not itself publish content.

## Consequences
The next phase can exercise the full scoring + canonical story flow through one deterministic gate while preserving separation of authority between discovery, verification, event intelligence, scoring, editorial generation and publication.
