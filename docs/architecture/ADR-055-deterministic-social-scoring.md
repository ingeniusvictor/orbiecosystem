# ADR-055 — Deterministic Social Scoring

## Status
Accepted — NA-09.3

## Context
ORBI News already stores an optional `socialScore` on the Canonical Story and uses a social threshold in Breaking eligibility, but the score previously lacked a canonical calculation model.

Social distribution answers a different question from editorial relevance, factual verification, discovery priority, or publication authority. Reusing any of those scores would collapse separate axes and violate the ORBI News architecture.

## Decision
Define an independent deterministic Social Score composed of six dimensions, each scored from 0 to 100:

- Audience Interest — 25%
- Visual Potential — 15%
- Conversation Potential — 15%
- Practical Value — 20%
- Novelty — 10%
- Brand Fit — 15%

The weighted score is rounded to the nearest integer.

## Bands

- `REJECT`: 0–59
- `HOLD`: 60–79
- `CANDIDATE`: 80–89
- `PRIORITY`: 90–100

The V1 social distribution candidate threshold is 80. The priority threshold is 90. Breaking eligibility reuses the same 90-point priority threshold instead of defining a separate magic number.

## Constitutional separation

The following values remain independent:

`Discovery Score != Verification Confidence != ORBI Editorial Score != Social Score != Publication Authority`

A high Social Score cannot override verification, risk, editorial gates, publication state, Social Package readiness, length policy, or human-review requirements.

## Authority
The Social Score ranks suitability for secondary distribution only. It does not:

- make a story factual,
- approve a Canonical Story,
- mark a Social Package READY,
- publish to Facebook or Instagram,
- trigger email delivery by itself,
- override manual V1 distribution.

## Validation
All dimensions and resulting scores must be finite and between 0 and 100. Invalid input fails closed with a `RangeError`.

## Consequences
NA-09.4 can now build a Social Readiness Gate from independent evidence:

- Canonical Story publication state,
- ORBI Editorial Score,
- Social Score,
- deterministic length assessment,
- package structure/provenance,
- visual binding,
- risk/verification constraints.
