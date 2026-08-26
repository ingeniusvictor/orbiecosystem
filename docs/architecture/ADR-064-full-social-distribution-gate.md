# ADR-064 — Full Social Distribution Gate

**Status:** Accepted

## Context

NA-09 introduced the social distribution pipeline in separate deterministic layers: package contract, length policy, social score, readiness, copy builder, CTA/hashtag policy, visual binding, mailer contract, email payload, manual publication tracking and Control Center presentation.

A final compositional gate is required to prove that these pieces form one safe chain and that no caller must fabricate state changes manually.

## Decision

The canonical V1 chain is:

1. `CanonicalStory` is already `PUBLISHED`.
2. Social Score is calculated independently.
3. `buildSocialPackageDraft()` creates a `DRAFT` package.
4. `applySocialDistributionPolicy()` applies deterministic CTA and allowlisted hashtags.
5. `bindSocialImage()` binds an already validated 16:9 visual.
6. `evaluateSocialReadiness()` returns `READY` only when all deterministic requirements pass.
7. `markSocialPackageReady()` is the only domain helper introduced by this gate to materialize `DRAFT -> READY`; it re-runs the readiness gate and fails closed for `REVIEW`, `DEFER`, or `BLOCK`.
8. `createSocialMailerJob()` creates delivery state only after the package is `READY`.
9. `transitionSocialMailerJob()` applies the existing mailer state machine rather than allowing callers to assign statuses directly.
10. `generateSocialEmailPackage()` creates the email payload while the job is `NOT_CREATED` or `GENERATING`.
11. A delivery integration may then transition `GENERATING -> READY -> SENDING -> SENT` after real provider outcomes.
12. Manual Facebook and Instagram publication remain separate records in `ManualPublicationTracker`.
13. Distribution is complete only when both V1 platform records are `POSTED`.

## Authority boundaries

- Social Score is not publication authority.
- `evaluateSocialReadiness()` decides readiness but does not mutate the package.
- `markSocialPackageReady()` may materialize `READY` only after the gate returns `READY`.
- Email payload generation does not send email.
- Mailer state transitions do not contact a provider.
- Email `SENT` does not imply Facebook or Instagram `POSTED`.
- Facebook `POSTED` does not imply Instagram `POSTED`.
- The UI remains a presentation/request surface, not authority.

## Fail-closed coverage

The full gate proves that:

- copy exceeding 2200 Unicode code points cannot be promoted to `READY`, even with a falsified stored count;
- stale canonical-story provenance cannot be promoted to `READY`;
- a visual from another organization cannot be bound;
- a second different post cannot overwrite an already `POSTED` platform record;
- the positive path reaches `READY`, email `SENT`, Facebook `POSTED`, Instagram `POSTED`, and complete manual distribution using only domain-authorized transitions.

## Consequence

NA-09 can be considered closed only after TypeScript validation and the complete deterministic ORBI News suite pass with `orbi-news-social-distribution-full-gate.test.ts` included.

No Gmail/SMTP or Meta API integration is introduced by this ADR. External delivery remains a later runtime concern.
