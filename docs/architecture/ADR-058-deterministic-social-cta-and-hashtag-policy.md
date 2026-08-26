# ADR-058 — Deterministic Social CTA and Hashtag Policy

## Status
Accepted — NA-09.6.

## Context
NA-09.5 creates a factual, platform-neutral SocialPackage draft from a published CanonicalStory. CTA wording and hashtags were deliberately left unresolved so they would not be invented by the builder or a model.

ORBI News V1 requires a small, deterministic distribution policy for Facebook and Instagram that preserves brand identity, avoids hashtag spam, and never grants content-readiness authority.

## Decision
CTA and hashtag selection are deterministic domain functions.

### CTA authority
CTA text is selected only from the CanonicalStory `format` using a fixed allowlist. Free-form headline/body text is never used to synthesize CTA language.

The current mapping covers:
- NEWS_POST
- BREAKING_NEWS
- EXPLAINER
- ANALYSIS
- EVENT_UPDATE
- SHORT_SCRIPT

### Hashtag authority
V1 hashtags are selected only from:
1. two fixed brand tags: `#ORBIEcosystem`, `#ORBINews`;
2. an explicit ContentCategory → hashtag allowlist.

Headline, dek, article body, source text, model output and user-generated text are not converted automatically into hashtags.

### Anti-spam bound
`SOCIAL_HASHTAG_MAX = 6`.

Selection order is deterministic:
1. brand tags;
2. primary-category tags;
3. secondary-category tags in declared order;
4. case-insensitive deduplication;
5. truncate to six tags.

### Copy assembly
After policy application, the CTA section is replaced with the policy-owned CTA. Hashtags are appended as the final block after one blank line. `characterCount` is recomputed from the final copy using the NA-09.2 Unicode counter.

### Readiness boundary
The policy accepts only `SocialPackageStatus.DRAFT` and always returns `DRAFT`.

It cannot:
- mark a package READY;
- publish to Facebook or Instagram;
- send email;
- override Social Readiness Gate;
- override verification, risk, ORBI score or Social score.

The authoritative readiness decision remains `evaluateSocialReadiness()`.

## Security and integrity
The policy rejects story and organization mismatches before applying any distribution content.

Because hashtags are allowlisted rather than derived from arbitrary story text, malformed or deceptive text cannot become a platform tag through this layer.

## Consequences
- Social copy has stable ORBI branding.
- Hashtag volume is bounded and predictable.
- CTA language is reproducible by content format.
- Final length is measured after hashtags, preventing hidden growth beyond the hard limit.
- Future platform-specific CTA variants can be introduced without changing factual social-copy generation.

## Non-goals
NA-09.6 does not implement:
- AI hashtag generation;
- trend discovery;
- social publishing;
- email delivery;
- link shortening;
- platform-specific analytics;
- READY state transitions.
