# ADR-035 — Published News Server API Boundary

## Status
Accepted for NA-07.7.

## Decision
The ORBI News public portal consumes news only through the trusted Express server API. The browser does not read editorial persistence directly.

Public endpoints:

- `GET /api/news`
- `GET /api/news/category/:category`
- `GET /api/news/:slug`

A story is publicly eligible only when all of the following are true:

1. `CanonicalStoryStatus.PUBLISHED`
2. `PublicationStatus.PUBLISHED`
3. `PublicationChannel.ORBI_WEB`

Approval, readiness, scheduling or publication to a social channel is insufficient for public web exposure.

## Boundary
`PublicNewsReader` is the persistence-facing interface. NA-07.7 intentionally provides an empty reader adapter and does not select a database. A future persistence adapter may read PostgreSQL or another managed store without changing the HTTP or frontend contracts.

The server converts only eligible records into `PublicNewsFeed` / `PublicNewsArticle` DTOs. The public frontend cannot promote drafts or approvals into published content.

## Frontend behavior
`src/news/repository.ts` uses the HTTP API only. Runtime response shape is validated before use. Malformed JSON is rejected instead of being rendered as a partial public story.

`404` for an article maps to `null`. Other HTTP failures are surfaced as repository errors and must not be interpreted as an empty verified article.

## Breaking
The service may expose `breaking` only from the already published web article set. The UI additionally requires `isBreaking === true` before rendering the Breaking banner.

## Ordering
Public feeds are ordered by `publishedAt` descending. Ordering is deterministic and based on publication timestamp, not discovery timestamp.

## Security and authority
The API is read-only in NA-07.7. No public route can create, approve, modify or publish a story.

No database credentials, provider credentials or editorial control data are exposed to the frontend.

## Consequences
- Web publication has a double publication-state guard.
- Draft leakage is prevented at the server boundary.
- Persistence remains replaceable.
- Public UI and persistence are decoupled.
- The browser consumes only normalized public DTOs.
