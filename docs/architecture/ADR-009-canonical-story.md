# ADR-009 — Canonical Story as the editorial source of truth

## Status
Accepted for ORBI News Intelligence V1.

## Context
ORBI News publishes to the ORBI website and prepares social content for manual Facebook and Instagram publication. If each channel generates its own independent text directly from source articles, facts, tone and editorial framing can diverge.

## Decision
A verified Event produces one CanonicalStory. Channel-specific outputs are derived from that CanonicalStory rather than directly from raw source material.

Canonical flow:

VERIFIED EVENT -> CANONICAL STORY -> WEB ARTICLE / SOCIAL PACKAGE / FUTURE SHORT SCRIPT

## Rules
- CanonicalStory must reference the verification record and event that authorize its content.
- Source references remain attached to the story.
- Channel formatters may shorten or adapt tone but may not introduce new factual claims absent from the CanonicalStory or verified evidence.
- V1 social copy has a hard maximum of 2200 characters.
- V1 social imagery uses a 16:9 ORBI News visual profile.
- Critical risk blocks publication. High risk or insufficient confidence requires human review.
- AI may draft editorial text but deterministic policy decides whether the artifact can advance.

## Consequences
This keeps web, email, Facebook, Instagram and future Shorts factually aligned while allowing platform-specific formatting. It also creates one auditable editorial object per event version.
