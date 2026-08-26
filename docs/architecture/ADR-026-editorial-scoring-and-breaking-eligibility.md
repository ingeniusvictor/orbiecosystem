# ADR-026 — Editorial Scoring and Breaking Eligibility

## Status
Accepted for NA-05.1 through NA-05.4.

## Decision
ORBI editorial scoring is a deterministic relevance/priority mechanism. It is not a truth, verification, approval, or publication authority.

The ORBI Editorial Score is calculated from six normalized dimensions:

- Strategic relevance: 25%
- Audience interest: 20%
- Practical value: 20%
- Novelty: 15%
- Timeliness: 10%
- Evidence strength: 10%

Each dimension is constrained to 0–100 and the weighted result is rounded to an integer from 0–100.

## Editorial bands

- 0–54: REJECT
- 55–74: HOLD
- 75–84: PUBLISH
- 85–92: PRIORITY
- 93–100: BREAKING_CANDIDATE

The 75-point boundary matches the V1 minimum web publication score. A score of 93 or more only creates a breaking candidate; it never makes a story breaking on its own.

## Breaking eligibility

Breaking eligibility requires all of the following:

- ORBI score >= 93
- Social score >= 90
- Verification confidence = VERY_HIGH
- Risk level = LOW
- Verification gate explicitly allowed
- Event resolution complete
- No event contradiction present

Failure of any condition makes the candidate ineligible for autonomous breaking treatment.

## Authority boundary

Discovery priority must not be reused as the editorial score. Verification confidence and risk must not be inferred from the editorial score. An AI system may propose structured dimension values or signals, but deterministic code calculates totals, bands, and breaking eligibility.

A perfect editorial score cannot override verification failure, elevated risk, unresolved event identity, or contradiction.
