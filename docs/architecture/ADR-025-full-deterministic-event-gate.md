# ADR-025 — Full Deterministic Event Gate

Status: Accepted for NA-04.10.

## Decision

Event Intelligence is closed by a deterministic end-to-end gate composed from the approved event-domain components. No model output, similarity score, or article count may directly mutate the canonical event state.

## Gate composition

Incoming evidence flows through:

1. event fingerprint construction;
2. candidate event matching;
3. same-event / related-event resolution;
4. material-update vs contradiction classification;
5. event evidence graph summarization;
6. event resolution policy;
7. consolidation/versioning when the policy authorizes mutation.

## Authoritative actions

The final policy may produce only:

- `CREATE_NEW_EVENT`
- `ATTACH_TO_EXISTING`
- `CREATE_EVENT_VERSION`
- `MARK_DISPUTED`
- `REQUIRE_HUMAN_REVIEW`

## Safety invariants

- Similarity does not equal truth or mutation authority.
- `SAME_EVENT` without a material change attaches evidence but does not create a version.
- Material updates create append-only event versions.
- Contradicting evidence cannot be averaged away by supporting evidence.
- A disputed event cannot silently return to normal autonomous mutation.
- Related or unresolved relationships require human review.
- Article count and unique-source count are distinct concepts and neither alone establishes truth.

## Version integrity

A canonical event changes only through the consolidation/versioning contract. Material changes increment the version and record changed fields plus deduplicated evidence IDs. Non-material evidence does not manufacture a new version.

## AI boundary

AI may propose normalized entities, subjects, change signals, summaries, or candidate relationships. Deterministic domain policy retains final authority over event identity, dispute state, consolidation and version creation.

## Exit criterion

NA-04 is considered complete only when deterministic tests exercise the full pipeline for new-event creation, same-event attachment, material version creation, contradictions/disputes, ambiguous related events and persistence of disputed state without regressions in earlier ORBI News domain suites.
