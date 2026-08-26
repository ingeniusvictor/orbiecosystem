# ADR-059 — Deterministic Social Image Binding

## Status
Accepted for NA-09.7.

## Context
A SocialPackage must carry a validated 16:9 visual before the Social Readiness Gate can return READY. The visual already has its own truth-label, origin and validation lifecycle under Visual Intelligence. Social distribution therefore must bind to an existing validated VisualAsset rather than inventing or silently replacing imagery.

## Decision
Introduce `bindSocialImage()` as a deterministic transformation from a DRAFT SocialPackage plus one VisualAsset to a DRAFT SocialPackage with `imageAssetId` populated.

Binding requires:

- SocialPackage status is DRAFT.
- VisualAsset organization matches SocialPackage organization.
- VisualAsset canonicalStoryId matches SocialPackage canonicalStoryId.
- VisualAsset status is VALIDATED.
- VisualAsset aspect ratio is 16:9.
- VisualAsset has a non-empty absolute HTTP(S) asset URL.
- SocialPackage imageAspectRatio remains 16:9.

The operation changes only:

- `imageAssetId`
- `updatedAt`

It must not change:

- package status,
- copy,
- hashtags,
- sections,
- character count,
- provenance,
- target platforms.

## Replacement policy
If the SocialPackage already contains an `imageAssetId`, binding is idempotent only when the requested VisualAsset has the same ID.

Attempting to bind a different VisualAsset fails with:

`SOCIAL_VISUAL_REPLACEMENT_REQUIRES_EXPLICIT_REVIEW`

This prevents silent substitution of a visual that may already have been reviewed or prepared for distribution. A future explicit review/mutation flow may authorize replacement.

## Authority boundary
`bindSocialImage()` has no readiness or publication authority. It always preserves `SocialPackageStatus.DRAFT`.

The final authority remains `evaluateSocialReadiness()`, which independently checks the package and VisualAsset again before returning READY.

## Failure behavior
Cross-organization, cross-story, non-validated, missing URL, invalid URL and non-DRAFT bindings fail closed.

## Consequences
The social package can now reference one precise validated visual while retaining a deterministic audit-friendly boundary between visual validation and social readiness.
