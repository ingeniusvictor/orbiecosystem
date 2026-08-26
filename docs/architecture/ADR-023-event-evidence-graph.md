# ADR-023 — Event Evidence Graph

Status: Accepted for NA-04.8.

## Decision

ORBI News models event evidence as an explicit domain graph instead of treating a flat article count as factual strength.

Each evidence node represents one `NewsItemId` and carries a normalized `sourceKey`, confidence and attachment timestamp. Each edge connects that news item to one event with a typed stance:

- `SUPPORTING`
- `CONTRADICTING`
- `CONTEXT`

## Independence rule

Article count and source independence are separate quantities.

Three articles from the same publisher count as three evidence items but only one unique source. ORBI must never infer three independent corroborations from three URLs owned by the same source identity.

## Deduplication

- Evidence nodes are unique by `NewsItemId`.
- Evidence edges are unique by `(eventId, newsItemId, stance)`.
- `sourceKey` is normalized before independent-source metrics are calculated.

## Contradiction

The graph summary exposes contradiction presence and unique contradicting source count, but it does not by itself decide whether a contradiction is authoritative or publication-blocking. That authority remains in verification/event resolution policy.

## Context

Context evidence is preserved but never counted as supporting evidence. Historical analysis, explanatory reporting and background material may help editorial synthesis without becoming proof of the event itself.

## Persistence boundary

The domain contract is storage-neutral. V1 may persist it relationally; a graph database is not required. Infrastructure must preserve node and edge semantics if the persistence implementation changes later.

## Safety invariant

`number of articles != number of independent sources != truth`.

The evidence graph organizes provenance. It does not replace the verification engine.
