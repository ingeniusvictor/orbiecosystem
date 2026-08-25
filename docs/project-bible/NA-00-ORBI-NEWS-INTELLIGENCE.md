# ORBI News Intelligence — NA-00 Project Bible

## Mission
ORBI News Intelligence is the editorial intelligence layer of ORBI Ecosystem. It discovers relevant technology and innovation news, verifies facts, consolidates multiple articles into canonical events, scores editorial value, produces an original ORBI story, publishes selected stories to the ORBI website, and prepares a ready-to-use social package for manual Facebook and Instagram publication.

## V1 Operating Model
- The ORBI website is the primary editorial channel.
- Facebook and Instagram remain human-in-the-loop in V1.
- The system may automatically publish low-risk, sufficiently verified stories to the ORBI News web portal according to policy.
- Social publication is never automatic in V1. The agent prepares the copy, hashtags and 16:9 ORBI-branded image and sends the package by email.

## Canonical Flow
SOURCE LAYER -> DISCOVERY -> INGESTION -> VERIFICATION -> EVENT INTELLIGENCE -> ORBI SCORING -> CANONICAL STORY -> WEB PUBLICATION -> SOCIAL PACKAGE -> EMAIL DELIVERY -> MANUAL META PUBLICATION

## Constitutional Rules
1. AI is not publication authority.
2. The language model is never a source of record.
3. Verification and editorial priority are separate axes.
4. Source provenance must be persisted.
5. Exact duplicate articles and semantic duplicate events are different concepts.
6. High-risk stories require human review.
7. Critical-risk stories may not auto-publish.
8. Publishing must be idempotent.
9. Infinite retries are forbidden.
10. Secrets must never be exposed to the browser or committed to Git.
11. Internal timestamps use UTC; editorial presentation uses America/Santiago.
12. Content must be original ORBI synthesis, not copied article text.
13. ORBI News web is the primary editorial distribution surface.
14. Facebook and Instagram are human-in-the-loop in V1.
15. Social copy cannot be READY when it exceeds 2200 characters.
16. Social images use a 16:9 ORBI News visual profile unless a future platform-specific variant is explicitly defined.
17. The kill switch and system mode override all autonomous agents.
18. Non-configured capabilities must be represented truthfully as NOT_CONFIGURED, not as AVAILABLE.

## Autonomy Levels
- LEVEL_0 — Disabled
- LEVEL_1 — Discovery
- LEVEL_2 — Intelligence
- LEVEL_3 — Creation
- LEVEL_4 — Approval Assisted
- LEVEL_5 — Controlled Autonomy

LEVEL_5 remains constrained by policy and never overrides risk or kill-switch rules.

## System Modes
- NORMAL
- READ_ONLY
- MAINTENANCE
- EMERGENCY_STOP

## Risk Levels
- LOW
- MEDIUM
- HIGH
- CRITICAL

HIGH requires human review. CRITICAL blocks autonomous publication.

## Primary Content Categories
- AI
- TECH
- SOLAR
- ENERGY
- ROBOTICS
- AUTOMATION
- CYBERSECURITY
- SOFTWARE
- HARDWARE
- SCIENCE
- STARTUPS
- SPACE
- FUTURE_TECH

## Editorial Principles
- Prefer primary and official sources.
- Distinguish publication date from event date.
- Clearly represent uncertainty.
- Never fabricate metrics, quotes or source claims.
- Avoid deceptive clickbait.
- Preserve source attribution.
- Do not publish the same event repeatedly unless a material update exists.
- Explain what happened, why it matters and what changes in practice.
- Preserve ORBI's educational and analytical identity.

## Web Publication Threshold — Initial Policy
A web story may become an autonomous candidate when:
- ORBI score >= 75
- verification is sufficient for policy
- duplicate status is acceptable
- risk is LOW or policy-allowed MEDIUM
- publishing is enabled

These thresholds are configuration, not hard-coded domain truth.

## Social Package Policy — Initial
A social package candidate normally requires:
- ORBI score >= 85
- Social score >= 80
- verification accepted
- story already published or approved for ORBI News

Social copy target: 1500–1900 characters.
Social copy hard maximum: 2200 characters.
Social image aspect ratio: 16:9.

## Canonical Story
CanonicalStory is the editorial master representation of a verified event. Platform-specific outputs derive from it.

Expected fields include:
- id
- organizationId
- eventId
- headline
- summary
- whatHappened
- whyItMatters
- practicalImpact
- futureOutlook
- categories
- sources
- verificationStatus
- orbiScore
- riskLevel
- slug
- publishedAt

## Social Package
Expected fields include:
- id
- canonicalStoryId
- socialHeadline
- facebookInstagramCopy
- hashtags
- visualBrief
- imageAsset
- webArticleUrl
- characterCount
- socialScore
- generatedAt
- deliveryStatus

## Visual Identity
The V1 social/news visual profile must be:
- ORBI Ecosystem branded
- technology-forward
- editorial rather than sensationalist
- visually consistent across stories
- 16:9 for the shared V1 web/social asset
- low text density
- clearly illustrative when AI-generated rather than documentary evidence

## Architecture Boundary
The existing ORBI web application currently uses React + Vite + Express. ORBI News will integrate into that architecture without forcing an immediate framework migration.

Domain rules must remain independent from:
- OpenAI or any specific AI vendor
- Meta
- Vercel
- email provider
- database vendor
- news/RSS/search provider

## Roadmap
- NA-00 — Project Bible and architecture
- NA-01 — Foundation and Domain
- NA-02 — News Discovery
- NA-03 — Verification Engine
- NA-04 — Event Intelligence
- NA-05 — Scoring and Canonical Story
- NA-06 — Visual Intelligence
- NA-07 — ORBI News Public Portal
- NA-08 — Editorial Control Center
- NA-09 — Social Distribution Assistant + Email Delivery
- NA-10 — Autonomous Operations

## Repository Strategy
Primary repository: v1m2l3p4/orbiecosystem
Development branch: feature/orbi-news-agent
Stable production branch: main

All ORBI News work remains isolated on the feature branch until validation and merge approval.
