# ADR-054 — Deterministic Social Copy Length Policy

## Status
Accepted — NA-09.2

## Context
ORBI News V1 prepares one platform-neutral social copy for Facebook and Instagram. The product policy defines a preferred range of 1500–1900 characters, a warning range above that target, and an absolute 2200-character hard limit.

A stored `characterCount` cannot be treated as authority because it can be stale, malformed, or model-generated. Readiness must be derived from the actual copy deterministically.

## Decision
Introduce a dedicated social length policy with a Unicode code-point counter and deterministic classification.

### Counting rule
`countSocialCopyCharacters(copy)` uses `[...copy].length`, preserving the character-count behavior already used by the project. This counts Unicode code points rather than UTF-16 code units.

### Bands
- `BELOW_TARGET`: 0–1499
- `TARGET`: 1500–1900
- `WARNING`: 1901–2100
- `HIGH`: 2101–2200
- `BLOCKED`: >2200

`TARGET` is the editorial objective, not a publication authority signal. `WARNING` and `HIGH` remain within the V1 hard limit. `BLOCKED` is not eligible for READY.

### Authority
The actual copy is authoritative. `SocialPackage.characterCount` is only a persisted/cache value and must match the recomputed count.

`evaluateSocialPackageLengthConsistency()` returns:
- recomputed character count,
- deterministic length band,
- hard-limit status,
- READY eligibility,
- stored-count consistency,
- compatibility between the package status and the measured copy.

### READY invariant
A `SocialPackage` with measured length greater than 2200 characters cannot be valid while in `READY`, even if its stored `characterCount` claims a smaller value.

A DRAFT above 2200 remains invalid content and is not READY-eligible, but status incompatibility is reserved for a package that actually claims READY.

## Consequences
1. AI/model output cannot self-certify character count.
2. Stored metadata cannot override the actual copy.
3. Boundary behavior is stable and testable.
4. Future social readiness gates can reuse this policy directly.
5. Compact/regeneration logic can react to `BLOCKED` without duplicating thresholds.

## Non-goals
NA-09.2 does not implement:
- social scoring,
- content generation or compaction,
- hashtag/CTA policy,
- email delivery,
- Facebook or Instagram publishing.

Those remain later NA-09 phases.
