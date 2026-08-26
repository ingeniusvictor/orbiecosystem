# ADR-024 — Event Resolution Policy

Status: Accepted for NA-04.9.

## Decision

Event mutation authority is deterministic. Similarity, update classification, evidence graph state, and current event status are combined by `evaluateEventResolutionPolicy` into one action.

## Actions

- `CREATE_NEW_EVENT`
- `ATTACH_TO_EXISTING`
- `CREATE_EVENT_VERSION`
- `MARK_DISPUTED`
- `REQUIRE_HUMAN_REVIEW`

## Precedence

1. Contradiction in the change assessment, contradiction in the evidence graph, or an already disputed event -> `MARK_DISPUTED` when a target event is known.
2. Contradiction without a resolved target event -> `REQUIRE_HUMAN_REVIEW`.
3. Mixed/ambiguous change assessment, `RELATED_EVENT`, or `UNRESOLVED` -> `REQUIRE_HUMAN_REVIEW`.
4. `NEW_EVENT` -> `CREATE_NEW_EVENT`.
5. Material update -> `CREATE_EVENT_VERSION`.
6. `SAME_EVENT` with no material change -> `ATTACH_TO_EXISTING`.
7. Any unhandled combination fails safe to `REQUIRE_HUMAN_REVIEW`.

## Safety invariant

Similarity is not authority to mutate an event. A high similarity score cannot override contradiction evidence or an explicit requirement for human review.

A disputed event cannot silently return to a non-disputed path simply because a later article looks similar.

## Relationship to prior ADRs

- ADR-020 defines deterministic event fingerprint and similarity resolution.
- ADR-021 separates material update from contradiction.
- ADR-022 defines append-only event versioning.
- ADR-023 defines evidence graph semantics and source independence.

ADR-024 combines those outputs into the final event-resolution action but does not persist or publish anything by itself.

## Audit

The chosen action, target event id, candidate outcome, similarity score, change classification, contradiction state, existing event status, and reason codes should be persisted in the audit trail. AI recommendations may be recorded but are not the authoritative action.
