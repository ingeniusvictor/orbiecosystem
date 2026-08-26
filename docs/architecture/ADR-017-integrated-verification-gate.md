# ADR-017 — Integrated Verification Gate

Status: Accepted for ORBI News V1.

## Decision

ORBI News uses one integrated deterministic verification gate before any story can enter the editorial pipeline.

The integrated gate combines:

- VerificationRecord status and confidence.
- Deterministic risk level.
- Claim sensitivity.
- Research strategy completion state.
- Corroboration requirements.
- Eligible primary-source requirements.

No AI model may directly return an authoritative publication eligibility decision.

## Decision precedence

1. CRITICAL risk -> BLOCK.
2. Authoritative contradiction -> REQUIRE_HUMAN_REVIEW.
3. Autonomous research budget exhausted -> REQUIRE_HUMAN_REVIEW.
4. Research still incomplete -> DEFER.
5. Corroboration requirements not satisfied -> DEFER.
6. Required eligible primary source missing -> DEFER.
7. Existing Verification Gate policy is applied.
8. Only a fully passing result may return ALLOW_EDITORIAL_PIPELINE.

## Important distinction

A VerificationRecord marked VERIFIED is necessary but not sufficient for autonomous progression. Research and corroboration policy must also be satisfied.

Likewise, STOP_SUFFICIENT from the research strategy does not itself authorize editorial progression; the VerificationRecord, confidence and risk gate must still pass.

## Human review

Human review is required when autonomous research reaches its bounded budget without resolving the case or when authoritative evidence contradicts a material claim.

## Safety invariant

Critical risk always has precedence over apparent research sufficiency or verification confidence.
