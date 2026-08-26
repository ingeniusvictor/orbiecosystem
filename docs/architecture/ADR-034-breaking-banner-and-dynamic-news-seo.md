# ADR-034 — Breaking Banner and Dynamic News Article SEO

## Status
Accepted for NA-07.

## Context
The public ORBI News portal needs to surface urgent published stories and expose article-specific metadata without allowing the frontend to invent a second editorial representation.

## Decision
The public Breaking banner is driven only by the published feed contract. A candidate is displayed only when both conditions are true:

1. `feed.breaking` is present.
2. `feed.breaking.isBreaking === true`.

The frontend does not calculate Breaking eligibility. That authority remains upstream in deterministic editorial policy.

Article SEO is built from the same `PublicNewsArticle` rendered on `/news/:slug`. The metadata builder derives:

- headline/title
- dek/description
- canonical URL from the published slug
- publication timestamp
- primary category
- published image URL when present
- OpenGraph `article`
- Twitter summary-large-image metadata
- Schema.org `NewsArticle` JSON-LD

No separate SEO headline, description, date or image record is accepted by the portal.

## Metadata application boundary
`NewsPortal` does not mutate `<head>` directly. It emits a `SeoRouteMetadata` value through the callback provided by `App.tsx`; the existing application-level metadata manager remains the only writer of managed document metadata.

While an article is loading, missing or unpublished, the portal falls back to the canonical `/news` collection metadata. This prevents stale metadata from a previously loaded story.

## Image rule
If a published article has no image URL, OpenGraph, Twitter and JSON-LD omit the image field instead of fabricating or substituting an unverified asset.

## Safety invariants
- Public UI never promotes a card to Breaking by itself.
- A populated `feed.breaking` field with `isBreaking=false` is ignored.
- Dynamic metadata cannot diverge from the rendered `PublicNewsArticle` fields.
- Article metadata does not create or modify verification, event, editorial or publication authority.
- No fake stories are introduced for SEO or Breaking demonstrations.

## Consequences
Persistence/API adapters must provide already-published `PublicNewsArticle` objects and may optionally provide one Breaking card in a feed. Future server-side rendering or prerendering can reuse the pure metadata builder without changing editorial policy.
