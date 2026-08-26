# ADR-033 — Public ORBI News Portal Routing and Data Boundary

## Status
Accepted for NA-07 foundation.

## Decision
ORBI News public pages use the existing pathname-based routing style already present in the React/Vite application. No new router dependency is introduced for the initial portal foundation.

Public routes:
- `/news`
- `/news/:slug`
- `/news/category/:category`

The parser is deterministic and fails closed for unknown categories, invalid slugs and nested unsupported paths.

## Data Boundary
The public UI depends on a `PublicNewsRepository` interface rather than directly on persistence, AI providers or verification internals.

The repository exposes only publication-safe projections:
- public cards
- public article sections
- public source references
- breaking marker
- canonical image URL

The initial implementation intentionally returns an empty feed and no articles. This avoids invented demo news while persistence and publication adapters are not yet connected.

## Authority
The public portal does not decide whether a story is publishable. It may only render records that upstream application services expose as published.

The public UI cannot:
- verify claims
- resolve events
- modify editorial score
- approve a story
- validate an image
- publish a story

## SEO
`/news` receives a canonical public metadata record and CollectionPage structured data. Dynamic article/category metadata will be added after published-data integration so the application does not fabricate article metadata for records that do not exist.

## CI
Because NA-07 introduces frontend code, the ORBI News workflow now watches `src/news/**`, `src/App.tsx` and `src/seoMetadata.ts` and runs TypeScript validation before deterministic tests.

## Consequences
- No new routing dependency.
- Existing home, Climate Recovery and PBMetrics routes remain isolated.
- Persistence can be replaced without changing presentation components.
- Public pages remain empty until real published stories are available.
- Frontend TypeScript regressions become part of the ORBI News gate.
