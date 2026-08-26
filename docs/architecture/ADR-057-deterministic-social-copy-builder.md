# ADR-057 — Deterministic Facebook / Instagram Social Copy Builder

## Status
Accepted — NA-09.5

## Context
ORBI News requires a repeatable transformation from a published `CanonicalStory` into a Facebook/Instagram-oriented `SocialPackage` draft. The transformation must not create new factual claims, must not claim publication authority, and must remain downstream of verified/canonical editorial content.

## Decision
Introduce `buildSocialPackageDraft()` in `domain/editorial/social-copy-builder.ts`.

The builder accepts:
- a package id,
- a `CanonicalStory`,
- the current opaque story revision,
- the public ORBI News article URL,
- an explicit CTA supplied by the caller,
- a creation timestamp.

The builder only accepts stories whose status is `PUBLISHED` and whose `publishedAt` is non-null.

## Deterministic section mapping
The social draft contains exactly six ordered sections:

1. `HOOK` ← canonical story headline
2. `WHAT_HAPPENED` ← canonical `WHAT_HAPPENED.body`
3. `WHY_IT_MATTERS` ← canonical `WHY_IT_MATTERS.body`
4. `PRACTICAL_IMPLICATION` ← canonical `PRACTICAL_IMPACT.body`
5. `ORBI_LENS` ← canonical `ORBI_LENS.body`
6. `CTA` ← explicit caller-supplied CTA

`SUMMARY` and `FUTURE_OUTLOOK` are not automatically copied into the V1 social body.

The final copy is assembled by joining the six section texts with one blank line (`\n\n`). No generative model participates in this transformation.

## Builder authority boundary
The builder always returns:

- `SocialPackageStatus.DRAFT`
- V1 target platforms Facebook + Instagram
- `hashtags: []`
- `imageAssetId: null`
- `imageAspectRatio: 16:9`

It never returns `READY`, never sends email, and never publishes to a social platform.

Readiness remains exclusively controlled by `evaluateSocialReadiness()`.

## CTA and hashtag boundary
NA-09.5 does not define CTA language or hashtag policy.

The caller must supply a non-empty CTA. NA-09.6 will define deterministic CTA and hashtag policy. Hashtags remain empty in the builder output until that policy is applied.

## Provenance
Every generated draft records:

- `canonicalStoryId`
- `canonicalStoryRevision`
- public ORBI News article URL

This enables the Social Readiness Gate to defer stale packages after a canonical story revision changes.

## Character count
`characterCount` is computed from the final assembled copy through `countSocialCopyCharacters()`. The caller cannot provide or override the count.

## URL policy
The web article URL must be an absolute `http` or `https` URL. The normalized URL is stored both on the package and in provenance.

## Factual integrity
The builder does not summarize, paraphrase, truncate, compact, or enrich canonical factual sections. It copies approved canonical section bodies verbatim into their mapped social sections.

Any future AI-assisted rewrite must be implemented as a separate proposal layer and cannot bypass grounding or readiness authority.

## Consequences
### Positive
- deterministic and testable social transformation,
- no factual invention,
- stable provenance,
- readiness authority remains separate,
- CTA/hashtags can evolve independently.

### Trade-offs
- canonical story text may be longer than the social target range,
- the resulting draft may therefore be `DEFER`, `REVIEW`, or `BLOCK` at the readiness gate,
- later copy optimization must remain a separate controlled transformation.

## Non-goals
NA-09.5 does not:
- generate hashtags,
- decide CTA wording,
- bind a visual asset,
- mark a package READY,
- persist packages,
- send email,
- post to Facebook or Instagram,
- use a generative model.
