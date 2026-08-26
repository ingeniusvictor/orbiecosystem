# ADR-027 — Canonical Story Grounding Contract

## Status
Accepted for NA-05.5 through NA-05.8.

## Decision
ORBI News uses a deterministic `CanonicalStory` builder between verified event intelligence and editorial generation.

The builder does not decide truth. It accepts only claims and sources that have already been admitted by the verification/event pipeline and rejects undeclared claim or source identifiers.

## Required canonical structure
Every canonical story must include:

- `SUMMARY`
- `WHAT_HAPPENED`
- `WHY_IT_MATTERS`
- `PRACTICAL_IMPACT`
- `ORBI_LENS`

`FUTURE_OUTLOOK` remains optional and must not be written as certainty when it is predictive.

## Grounding contract
Each proposed section must declare:

- one or more `claimKeys` from the verified claim set;
- one or more `sourceKeys` from the verified source set.

Unknown claims or sources are rejected. A story must contain at least one verified primary source.

This contract prevents the generative layer from registering new factual authority. A model may paraphrase or organize already-grounded material, but it cannot create a new authoritative claim or source identity.

## Editorial limits
V1 deterministic limits:

- headline: maximum 120 Unicode code points;
- dek: maximum 220 Unicode code points;
- slug: lowercase kebab-case, maximum 100 Unicode code points.

Limits use Unicode code points rather than UTF-16 code units.

## ORBI Lens
`ORBI_LENS` is mandatory. It must add educational or practical interpretation without changing the underlying verified facts. ORBI analysis is not a substitute for source evidence.

## Attribution
The public canonical story exposes only verified source references selected from the builder input. Duplicate source keys are collapsed. At least one source reference must be primary.

## Non-authorities
The builder does not:

- perform verification;
- establish truth;
- convert discovery priority into evidence;
- approve publication;
- infer factual support from model confidence.

Semantic entailment between generated prose and the admitted claims remains subject to later editorial validation and human review where required. The deterministic builder guarantees declared provenance and rejects undeclared factual identities; it does not pretend to solve semantic verification by string rules.
