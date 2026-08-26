# ADR-063 — Social Distribution Control Center UI

Status: Accepted

## Context

NA-09.1 through NA-09.10 established social package readiness, copy, score, visual binding, mail delivery state, and independent manual Facebook/Instagram publication tracking. The private `/editorial` surface needs to expose these states without turning browser rendering into authority.

## Decision

The editorial queue may carry an optional `SocialDistributionQueueView` produced by trusted server-side orchestration. It contains only presentation-ready social state: readiness, social score, final copy, deterministic character count, hashtags, approved image URL, mailer status, Facebook status, and Instagram status.

The browser validates the optional view fail-closed. Invalid enum values, counts, arrays, or shapes cause `EDITORIAL_QUEUE_INVALID_RESPONSE` rather than being rendered.

`EditorialControlCenter` mounts a `SocialDistributionPanel` for each queue item. When no social view exists, the UI explicitly says that the package is not prepared and does not infer readiness.

The panel is read-only in NA-09.11. It displays copy, hashtags, approved 16:9 visual, readiness, mailer state, and per-platform manual publication state. It does not create mail jobs, mark a package READY, send email, or record Facebook/Instagram publication.

## Authority boundary

UI rendering != social readiness authority.

UI rendering != email delivery authority.

UI rendering != manual publication authority.

All future social mutations must be revalidated and persisted server-side with organization scope, revision checks, and audit semantics before the UI may expose mutable controls.

## Compatibility

`socialDistribution` is optional and defaults to `null` in the queue view model, so existing persisted editorial queue sources remain valid without migration.

## Gate

NA-09.11 is PASS only when TypeScript and the full deterministic ORBI News suite pass with tests proving valid social view acceptance, malformed view rejection, independent platform labels, and no fabricated readiness when the view is absent.
