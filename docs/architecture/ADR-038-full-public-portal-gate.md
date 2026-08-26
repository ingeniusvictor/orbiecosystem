# ADR-038 — Full Public Portal Gate

## Status
Accepted for NA-07.10.

## Context
ORBI News now has public routing, article/detail views, Breaking presentation, dynamic SEO, an Express public API boundary, a home preview, and accessibility/resilience rules. NA-07 requires a final compositional gate that proves these pieces preserve publication authority end to end.

## Decision
The final public portal gate composes the existing production contracts rather than creating a second publication policy.

A story is publicly visible only when its `PublishedNewsSourceRecord` satisfies all of the following:

- `CanonicalStoryStatus.PUBLISHED`
- `PublicationStatus.PUBLISHED`
- `PublicationChannel.ORBI_WEB`

The gate then verifies the same downstream path used by the application:

1. `PublicNewsReader`
2. `PublicNewsService`
3. HTTP-shaped responses
4. `createHttpPublicNewsRepository`
5. index/category/article route contracts
6. Breaking selector
7. home latest-news selector
8. article SEO/NewsArticle JSON-LD builder
9. accessibility route helpers

## Invariants
- Draft, approved, ready, scheduled, failed, blocked, or non-web publication states must never leak into public feeds.
- A social publication does not imply an ORBI Web publication.
- Breaking is never inferred by the portal; it is rendered only from an already-published `isBreaking=true` record.
- Home preview uses the same public feed and cannot expand publication authority.
- SEO metadata is derived from the same public article returned by the repository.
- Category and retry/accessibility helpers must resolve to canonical public routes.
- The portal must not fabricate content when persistence is empty or unavailable.

## Scope boundary
This gate does not select a production database, deploy the branch, or test a real browser against production. Persistence and deployment remain separate infrastructure concerns.

## Consequence
With TypeScript validation, deterministic suites, and this compositional public gate green, NA-07 can be marked PASS while preserving the principle that the public frontend is a projection of already-authorized publication state, never an authority of its own.
