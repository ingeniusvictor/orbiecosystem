import type { IsoUtcDateTime } from '../common/types';
import {
  VisualAssetStatus,
  type VisualAsset,
} from '../visuals/visual-asset';
import {
  SocialPackageStatus,
  type SocialPackage,
} from './social-package';

export interface SocialImageBindingInput {
  readonly socialPackage: SocialPackage;
  readonly visualAsset: VisualAsset;
  readonly boundAt: IsoUtcDateTime;
}

const assertAbsoluteHttpUrl = (value: string): void => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new RangeError('SOCIAL_VISUAL_ASSET_URL_INVALID');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new RangeError('SOCIAL_VISUAL_ASSET_URL_INVALID');
  }
};

/**
 * Binds one already-validated 16:9 VisualAsset to a DRAFT SocialPackage.
 *
 * This operation has no authority to change SocialPackageStatus. A package that
 * is already bound may only be rebound idempotently to the same VisualAssetId;
 * replacing it with another asset requires an explicit future review action.
 */
export const bindSocialImage = (input: SocialImageBindingInput): SocialPackage => {
  const { socialPackage, visualAsset } = input;

  if (socialPackage.status !== SocialPackageStatus.DRAFT) {
    throw new RangeError('SOCIAL_IMAGE_BINDING_REQUIRES_DRAFT_PACKAGE');
  }

  if (visualAsset.organizationId !== socialPackage.organizationId) {
    throw new RangeError('SOCIAL_VISUAL_ORGANIZATION_MISMATCH');
  }

  if (visualAsset.canonicalStoryId !== socialPackage.canonicalStoryId) {
    throw new RangeError('SOCIAL_VISUAL_STORY_MISMATCH');
  }

  if (visualAsset.status !== VisualAssetStatus.VALIDATED) {
    throw new RangeError('SOCIAL_VISUAL_MUST_BE_VALIDATED');
  }

  if (visualAsset.aspectRatio !== '16:9' || socialPackage.imageAspectRatio !== '16:9') {
    throw new RangeError('SOCIAL_VISUAL_ASPECT_RATIO_INVALID');
  }

  if (!visualAsset.assetUrl?.trim()) {
    throw new RangeError('SOCIAL_VISUAL_ASSET_URL_REQUIRED');
  }
  assertAbsoluteHttpUrl(visualAsset.assetUrl.trim());

  if (
    socialPackage.imageAssetId !== null &&
    socialPackage.imageAssetId !== visualAsset.id
  ) {
    throw new RangeError('SOCIAL_VISUAL_REPLACEMENT_REQUIRES_EXPLICIT_REVIEW');
  }

  return {
    ...socialPackage,
    imageAssetId: visualAsset.id,
    updatedAt: input.boundAt,
  };
};
