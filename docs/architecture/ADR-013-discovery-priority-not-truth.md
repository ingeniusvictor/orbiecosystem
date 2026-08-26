# ADR-013 — Discovery priority is not truth

## Status
Accepted.

## Context
ORBI News needs to reduce the number of discovered links that enter expensive verification and event-resolution stages. A candidate may be timely and relevant while still being false, misleading, duplicated, speculative, or unsafe to publish.

## Decision
The Discovery Pre-Filter computes only investigation priority. It does not establish truth, verification status, editorial approval, publication eligibility, or risk clearance.

The V1 deterministic score is 0–100:

- Recency: 0–30
- Source quality: 0–25
- ORBI relevance: 0–30
- Priority signal: 0–15

Bands:

- 0–34: REJECT
- 35–54: LOW
- 55–74: INVESTIGATE
- 75–100: HIGH

Only INVESTIGATE and HIGH are normally forwarded to the verification pipeline.

## Authority boundary
A high discovery score means only: "this candidate is worth investigating."

It must never be interpreted as:

- VERIFIED
- TRUE
- APPROVED
- SAFE TO PUBLISH
- BREAKING NEWS CONFIRMED

Those decisions belong to later deterministic verification, risk, editorial, state-machine, and publication gates.

## Consequences
This separation lets ORBI News aggressively discover relevant material without allowing discovery heuristics or search ranking to become publication authority.
