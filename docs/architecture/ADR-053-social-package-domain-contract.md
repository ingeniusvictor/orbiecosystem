# ADR-053 — Social Package Domain Contract

## Status
Accepted for NA-09.1.

## Context
NA-08 closed the authenticated Editorial Control Center. NA-09 introduces secondary distribution for already authoritative ORBI News stories. The web article remains the primary publication; Facebook and Instagram are V1 secondary channels operated with a human-in-the-loop workflow.

The earlier `SocialPackage` contract was intentionally minimal and mixed content readiness with a legacy `SENT` state. Before scoring, copy generation, email delivery, or manual publication tracking, the domain requires one canonical package model.

## Decision
`SocialPackage` is the canonical, platform-neutral V1 representation used to derive the operator-ready Facebook/Instagram package.

It includes:

- `organizationId` for tenant isolation;
- `canonicalStoryId`;
- an opaque canonical story revision in provenance;
- target platforms (`FACEBOOK`, `INSTAGRAM`);
- ordered editorial sections;
- final copy;
- hashtags;
- deterministic character count field;
- one typed `VisualAssetId` with fixed V1 `16:9` profile;
- public ORBI News article URL;
- timestamps.

## Required editorial sections
V1 requires this order:

1. `HOOK`
2. `WHAT_HAPPENED`
3. `WHY_IT_MATTERS`
4. `PRACTICAL_IMPLICATION`
5. `ORBI_LENS`
6. `CTA`

The sections describe editorial structure only. They do not establish factual authority. All factual content must still derive from the authoritative Canonical Story and its verified provenance.

## Content state vs delivery state
`SocialPackageStatus` represents content lifecycle:

- `NOT_STARTED`
- `GENERATING`
- `DRAFT`
- `READY`
- `BLOCKED`
- `FAILED`

`SENT` is retained temporarily as a deprecated compatibility value. New code must not use `SENT` to represent package readiness or publication state.

Email delivery and manual Facebook/Instagram publication will receive separate state machines/contracts in later NA-09 phases.

Therefore:

`SocialPackage READY` != `email sent` != `Facebook posted` != `Instagram posted`.

## V1 platforms
Only Facebook and Instagram are canonical V1 targets. LinkedIn, TikTok, X, YouTube Community, or future channels require explicit contract extensions rather than free-form strings.

## Provenance
A package binds to the Canonical Story revision used to produce it. If the story changes after generation, later readiness policy can detect stale social content and require regeneration/review.

The public article URL is part of provenance because ORBI News web remains the primary publication and social content should direct readers back to the authoritative article when appropriate.

## Visual binding
`imageAssetId` uses the domain `VisualAssetId` type rather than an untyped string. V1 retains the fixed `16:9` ORBI social visual profile.

Visual binding does not prove the visual is safe or publication-ready; Visual Intelligence gates remain authoritative.

## Character policy constants
The contract preserves:

- target: 1500–1900 Unicode code points;
- warning zone: 1901–2100;
- hard maximum: 2200.

NA-09.2 will make character measurement/readiness deterministic. The stored `characterCount` field is descriptive and cannot override deterministic recomputation.

## Invariants
1. Web publication remains primary; social is secondary distribution.
2. A model cannot mark a package `READY` by itself.
3. Package status is not email/publication status.
4. V1 target platforms are canonical enums, not arbitrary strings.
5. The package records organization and Canonical Story provenance.
6. A social package cannot silently detach from the story revision from which it was generated.
7. Visual identity is typed and remains subject to Visual Intelligence authority.
8. The 2200-character hard limit cannot be overridden by model judgment.
9. No automatic Facebook/Instagram publishing is introduced in NA-09.1.
10. No mail delivery is introduced in NA-09.1.

## Consequences
NA-09.2 can now introduce deterministic character measurement without changing the package shape. Later scoring, readiness, builders, mail delivery, and manual publication tracking can compose around one stable canonical representation.
