# ADR-056 — Deterministic Social Readiness Gate

## Status
Accepted — NA-09.4

## Context
ORBI News needs a single deterministic authority that decides whether an already-created social package is actually ready to enter distribution preparation. Social scoring, character length, visual validation, story publication, provenance, risk, and verification are independent signals and must not be treated as interchangeable authority.

## Decision
Introduce `evaluateSocialReadiness()` with four outcomes:

- `READY`
- `REVIEW`
- `DEFER`
- `BLOCK`

The gate composes only deterministic inputs. It does not generate copy, modify a package, send email, or publish to social platforms.

## Required conditions for READY
A package can return `READY` only when all of the following are true:

- Canonical Story status is `PUBLISHED` and has `publishedAt`.
- ORBI Editorial Score is at least 85.
- Social Score is at least 80.
- Package organization and Canonical Story identity match.
- V1 target platforms are exactly Facebook and Instagram.
- Required social sections exist in canonical order and contain text.
- Social headline and copy are present.
- Stored character count equals deterministic measured count.
- Copy length is in the 1500–1900 target band.
- Public article URL exists.
- Provenance exists and binds the same story, current story revision, and article URL.
- A matching 16:9 Visual Asset exists for the same organization and story.
- Visual Asset is `VALIDATED` and has an asset URL.
- Risk is not HIGH or CRITICAL.
- Verification Confidence is HIGH or VERY_HIGH.

## Precedence
The gate uses fail-closed precedence:

1. `BLOCK`
2. `DEFER`
3. `REVIEW`
4. `READY`

### BLOCK examples
- organization/story identity mismatch
- invalid V1 platform contract
- malformed required sections
- stored character count mismatch
- copy above 2200 characters
- visual identity/organization/story mismatch
- provenance story/URL mismatch
- CRITICAL risk
- package status BLOCKED or FAILED

### DEFER examples
- story not yet published
- ORBI score below 85
- Social Score missing or below 80
- package still NOT_STARTED/GENERATING
- copy below 1500 characters
- missing public article URL
- missing provenance
- stale Canonical Story revision
- missing or not-yet-validated visual

### REVIEW examples
- HIGH risk
- verification below HIGH
- copy between 1901 and 2200 characters
- legacy `SENT` package status

## Character-count authority
`characterCount` stored on `SocialPackage` is never trusted. The gate calls the deterministic social length policy and compares the stored count with the measured Unicode code-point count.

## Provenance freshness
A social package binds the opaque Canonical Story revision used to create it. If the current persisted story revision differs, the package is `DEFER` and should be regenerated/revalidated rather than distributed from stale facts.

## Visual binding
Visual readiness requires identity consistency across:

`SocialPackage.imageAssetId → VisualAsset.id → organizationId → canonicalStoryId`

A visual from another story or tenant is a `BLOCK`, not a recoverable missing dependency.

## Non-authority statement
A Social Score of 100 cannot override publication status, verification, risk, hard copy limits, provenance, visual validation, or identity isolation.

## V1 distribution boundary
Even `READY` does not mean Facebook or Instagram are published automatically. V1 remains human-in-loop. Later phases will generate the package delivery email and track manual publication separately.
