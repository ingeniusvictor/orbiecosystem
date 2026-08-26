# ADR-036 — Home “Últimas en ORBI News” boundary

## Status
Accepted.

## Context
ORBI News needs discoverability from the corporate home without replacing the primary ORBI Ecosystem identity, product catalog, roadmap, or calls to action.

## Decision
The home page may render a compact `HomeLatestNews` section after the roadmap and before the final CTA.

The section:
- consumes the same `PublicNewsRepository.listLatest()` used by `/news`;
- never creates, verifies, scores, approves, or publishes news;
- renders at most three published cards;
- preserves the ordering received from the public API;
- links cards to canonical `/news/:slug` routes and includes a CTA to `/news`;
- returns no UI when the public feed is empty;
- returns no UI when the public API fails;
- uses lazy-loaded article images when available;
- does not introduce a new source of truth or separate home-only news data.

## Rationale
A hard maximum of three stories prevents ORBI News from turning the corporate landing page into a news-first property. Hiding the section on empty/error states protects the corporate experience while publication persistence is still being connected.

## Consequences
- The corporate home remains authoritative for the broader ecosystem.
- ORBI News gains a lightweight discovery surface once real published stories exist.
- Breaking status remains presentation-only on the home; eligibility is determined upstream.
- API/persistence changes continue to flow through the shared public news repository contract.

## Safety invariant

`Home visibility does not create publication authority.`
