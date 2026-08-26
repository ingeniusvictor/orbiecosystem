# ADR-022 — Event Consolidation and Versioning

Status: Accepted for NA-04.6 / NA-04.7.

## Decision

ORBI maintains one authoritative `EventRecord` per consolidated real-world event and preserves every material evolution as an append-only `EventVersion`.

## Consolidation contract

A consolidation operation compares the incoming canonical event state with the current `EventRecord`.

If no material field changes:

- the current event is returned unchanged;
- the version number is not incremented;
- no `EventVersion` snapshot is created;
- `updatedAt` is not modified merely because duplicate/context evidence arrived.

If one or more material fields change:

- the event version increments by exactly 1;
- event status becomes `UPDATED`;
- `updatedAt` becomes the consolidation timestamp;
- a new `EventVersion` is created;
- changed fields are explicitly recorded;
- evidence NewsItem IDs supporting that version are retained and deduplicated.

## Material versioned fields in V1

- `canonicalSummary`
- `confirmedEventDate`
- `confidence`
- `fingerprint`

Future fields may be added only through an explicit domain-policy change.

## Append-only invariant

Historical `EventVersion` snapshots must not be silently mutated or replaced. Infrastructure persistence must enforce append-only semantics for event versions.

## Evidence invariant

A version must retain the NewsItem IDs that justified the material change. Duplicate evidence identifiers do not count as additional independent evidence.

## Safety

Consolidation does not decide whether an incoming signal is an update or contradiction. That decision belongs to the update/contradiction policy established in ADR-021. Only material changes already accepted by event policy should reach consolidation.
