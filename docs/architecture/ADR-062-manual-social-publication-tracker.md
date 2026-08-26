# ADR-062 — Manual Social Publication Tracker

Status: Accepted

## Context
ORBI News V1 prepares social packages for manual posting through Meta Business Suite. Email delivery, Facebook publication and Instagram publication are independent operational facts and must not share one status.

## Decision
Introduce `ManualPublicationTracker` with one immutable platform record per V1 target (`FACEBOOK`, `INSTAGRAM`). A tracker may be created only for a `SocialPackage` in `READY` state and is pinned to the exact social package revision.

Each platform record has `NOT_POSTED`, `FAILED` or `POSTED`. Facebook and Instagram evolve independently. `FAILED` may later become `POSTED`. Once `POSTED`, the record is immutable except for an exactly identical idempotent replay.

A second different `POSTED` attempt is rejected with `MANUAL_PUBLICATION_DUPLICATE_POST_REQUIRES_EXPLICIT_REVIEW`. A stale package revision is rejected before state change. The tracker records the human actor, platform post URL and timestamp but does not publish to Meta or mutate `SocialPackage`/mailer state.

## Consequences
- Email `SENT` does not imply any social platform is posted.
- Facebook `POSTED` does not imply Instagram `POSTED`.
- Duplicate manual posting is fail-closed.
- A regenerated social package revision requires a new/reconciled tracker rather than silently reusing old publication state.
- `isManualPublicationComplete()` is true only after every V1 platform is `POSTED`.

## Non-goals
This ADR does not integrate Meta APIs, automate posting, persist tracker records, or expose UI controls. Those concerns are handled in later NA-09 phases.