# ADR-008 — Verification Authority and Publication Gate

## Status
Accepted for ORBI News Intelligence V1.

## Context
ORBI News may use AI to extract claims, compare sources, summarize evidence and propose confidence. AI output is probabilistic and cannot be the authority that decides whether a story is safe to publish.

## Decision
Verification is represented by a persisted `VerificationRecord` containing claims, evidence, source roles, confidence, risk and provenance. A deterministic verification gate decides whether the story may enter the editorial pipeline.

### Gate outcomes
- `ALLOW_EDITORIAL_PIPELINE`: verification is complete enough for downstream editorial work.
- `REQUIRE_HUMAN_REVIEW`: the story may be valid but has risk, contradiction, partial verification or insufficient confidence.
- `DEFER`: verification is incomplete or failed and the story must not proceed yet.
- `BLOCK`: policy forbids autonomous progression, including CRITICAL-risk stories.

## Required principles
1. A language model is never a source of record.
2. Every evidence item links to an actual source and NewsItem.
3. Primary, corroborating and contradicting sources are distinguished.
4. Confidence is stored both as a 0–100 score and a canonical band.
5. Confidence band mapping is deterministic: 0–24 VERY_LOW, 25–49 LOW, 50–69 MODERATE, 70–89 HIGH, 90–100 VERY_HIGH.
6. HIGH-risk stories always require human review.
7. CRITICAL-risk stories are blocked from autonomous progression.
8. Material contradictions always require human review.
9. PARTIALLY_VERIFIED stories cannot auto-progress.
10. A missing established primary source prevents autonomous progression in V1.

## Consequences
Verification remains auditable and reproducible even when AI providers or prompts change. Future verification engines may improve evidence extraction, but they cannot bypass the deterministic policy gate.
