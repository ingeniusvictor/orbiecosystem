# ADR-061 — Deterministic Social Email Package Generator

## Status
Accepted — NA-09.9

## Decision
ORBI News builds the complete Social Distribution Assistant email payload deterministically from already-authorized domain state. Payload generation is separate from mail delivery and cannot change `SocialPackageStatus` or `SocialEmailStatus`.

## Preconditions
The generator requires:

- `CanonicalStory.status = PUBLISHED` and `publishedAt != null`
- `SocialPackage.status = READY`
- matching organization and canonical story across story, package, mailer job and visual asset
- matching `SocialPackageId` between package and mailer job
- exact current canonical-story and social-package revisions matching mailer provenance
- current social-package provenance matching canonical story revision and public article URL
- a bound `VisualAssetId` matching a `VALIDATED` 16:9 visual with an HTTP(S) URL
- recomputed social-copy character count equal to the stored deterministic count
- mailer job in `NOT_CREATED` or `GENERATING`

## Payload boundary
The resulting `SocialEmailPackage` contains two deliberately separated blocks.

### Public package
Ready-to-use distribution material:

- published status
- headline
- ORBI score
- primary category
- complete social copy
- deterministic character count
- hashtags
- approved social image ID and URL
- public ORBI News article URL

### Private verification block
Editorial-only provenance and safety context:

- verification confidence
- risk level
- canonical story ID
- social package ID
- canonical story revision
- social package revision
- canonical verified source references

The private verification block is not appended to the social copy and is not intended for Facebook or Instagram publication.

## Authority boundary
`generateSocialEmailPackage()`:

- does not send email
- does not call Gmail, SMTP or another provider
- does not move the mailer job to `READY`, `SENDING` or `SENT`
- does not change social readiness
- does not rewrite factual content
- fails closed on stale or inconsistent provenance

Mail delivery remains a later capability.

## Consequence
Email rendering can be tested and reviewed independently from provider integration. The eventual provider receives a complete immutable payload whose public material and private verification context are clearly separated.