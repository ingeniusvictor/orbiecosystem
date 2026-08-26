import { RiskLevel, VerificationConfidence } from '../common/enums';
import type { CanonicalStory } from './canonical-story';
import { CanonicalStoryStatus } from './canonical-story';
import {
  SOCIAL_PACKAGE_REQUIRED_SECTIONS,
  SOCIAL_PACKAGE_V1_PLATFORMS,
  SocialPackageStatus,
  type SocialPackage,
} from './social-package';
import {
  SocialCopyLengthBand,
  evaluateSocialCopyLength,
} from './social-length-policy';
import { SOCIAL_SCORE_CANDIDATE_THRESHOLD } from './social-scoring';
import type { VisualAsset } from '../visuals/visual-asset';
import { VisualAssetStatus } from '../visuals/visual-asset';

export enum SocialReadinessDecision {
  READY = 'READY',
  REVIEW = 'REVIEW',
  DEFER = 'DEFER',
  BLOCK = 'BLOCK',
}

export interface SocialReadinessInput {
  readonly story: CanonicalStory;
  /** Opaque current persisted revision of the canonical story. */
  readonly storyRevision: string;
  readonly socialPackage: SocialPackage;
  readonly visualAsset: VisualAsset | null;
}

export interface SocialReadinessResult {
  readonly decision: SocialReadinessDecision;
  readonly reasons: readonly string[];
  readonly measuredCharacterCount: number;
  readonly lengthBand: SocialCopyLengthBand;
}

export const SOCIAL_ORBI_SCORE_MINIMUM = 85;

const hasExactV1Platforms = (socialPackage: SocialPackage): boolean => {
  if (socialPackage.targetPlatforms.length !== SOCIAL_PACKAGE_V1_PLATFORMS.length) return false;
  const actual = new Set(socialPackage.targetPlatforms);
  return SOCIAL_PACKAGE_V1_PLATFORMS.every((platform) => actual.has(platform));
};

const hasRequiredSectionsInOrder = (socialPackage: SocialPackage): boolean =>
  socialPackage.sections.length === SOCIAL_PACKAGE_REQUIRED_SECTIONS.length &&
  SOCIAL_PACKAGE_REQUIRED_SECTIONS.every(
    (section, index) =>
      socialPackage.sections[index]?.section === section &&
      Boolean(socialPackage.sections[index]?.text.trim()),
  );

export const evaluateSocialReadiness = (
  input: SocialReadinessInput,
): SocialReadinessResult => {
  const { story, storyRevision, socialPackage, visualAsset } = input;
  const length = evaluateSocialCopyLength(socialPackage.copy, socialPackage.characterCount);

  const blockReasons: string[] = [];
  const deferReasons: string[] = [];
  const reviewReasons: string[] = [];

  if (story.organizationId !== socialPackage.organizationId) {
    blockReasons.push('SOCIAL_PACKAGE_ORGANIZATION_MISMATCH');
  }
  if (story.id !== socialPackage.canonicalStoryId) {
    blockReasons.push('SOCIAL_PACKAGE_STORY_MISMATCH');
  }
  if (!hasExactV1Platforms(socialPackage)) {
    blockReasons.push('SOCIAL_PACKAGE_V1_PLATFORMS_INVALID');
  }
  if (!hasRequiredSectionsInOrder(socialPackage)) {
    blockReasons.push('SOCIAL_PACKAGE_REQUIRED_SECTIONS_INVALID');
  }
  if (!socialPackage.socialHeadline.trim() || !socialPackage.copy.trim()) {
    blockReasons.push('SOCIAL_PACKAGE_CONTENT_REQUIRED');
  }
  if (!length.storedCountMatches) {
    blockReasons.push('SOCIAL_PACKAGE_CHARACTER_COUNT_MISMATCH');
  }
  if (length.band === SocialCopyLengthBand.BLOCKED) {
    blockReasons.push('SOCIAL_COPY_HARD_LIMIT_EXCEEDED');
  }
  if (socialPackage.imageAspectRatio !== '16:9') {
    blockReasons.push('SOCIAL_IMAGE_ASPECT_RATIO_INVALID');
  }
  if (story.riskLevel === RiskLevel.CRITICAL) {
    blockReasons.push('CRITICAL_RISK_BLOCKS_SOCIAL_DISTRIBUTION');
  }
  if (
    socialPackage.status === SocialPackageStatus.BLOCKED ||
    socialPackage.status === SocialPackageStatus.FAILED
  ) {
    blockReasons.push(`SOCIAL_PACKAGE_STATUS_${socialPackage.status}`);
  }

  if (blockReasons.length > 0) {
    return {
      decision: SocialReadinessDecision.BLOCK,
      reasons: blockReasons,
      measuredCharacterCount: length.measuredCharacterCount,
      lengthBand: length.band,
    };
  }

  if (story.status !== CanonicalStoryStatus.PUBLISHED || story.publishedAt === null) {
    deferReasons.push('CANONICAL_STORY_NOT_PUBLISHED');
  }
  if (story.orbiScore < SOCIAL_ORBI_SCORE_MINIMUM) {
    deferReasons.push('ORBI_SCORE_BELOW_SOCIAL_THRESHOLD');
  }
  if (story.socialScore === null || story.socialScore < SOCIAL_SCORE_CANDIDATE_THRESHOLD) {
    deferReasons.push('SOCIAL_SCORE_BELOW_CANDIDATE_THRESHOLD');
  }
  if (
    socialPackage.status === SocialPackageStatus.NOT_STARTED ||
    socialPackage.status === SocialPackageStatus.GENERATING
  ) {
    deferReasons.push('SOCIAL_PACKAGE_NOT_READY_FOR_EVALUATION');
  }
  if (length.band === SocialCopyLengthBand.BELOW_TARGET) {
    deferReasons.push('SOCIAL_COPY_BELOW_TARGET_LENGTH');
  }
  if (!socialPackage.webArticleUrl?.trim()) {
    deferReasons.push('PUBLIC_ARTICLE_URL_REQUIRED');
  }
  if (socialPackage.provenance === null) {
    deferReasons.push('SOCIAL_PACKAGE_PROVENANCE_REQUIRED');
  } else {
    if (socialPackage.provenance.canonicalStoryId !== story.id) {
      blockReasons.push('SOCIAL_PROVENANCE_STORY_MISMATCH');
    }
    if (socialPackage.provenance.webArticleUrl !== socialPackage.webArticleUrl) {
      blockReasons.push('SOCIAL_PROVENANCE_URL_MISMATCH');
    }
    if (socialPackage.provenance.canonicalStoryRevision !== storyRevision) {
      deferReasons.push('SOCIAL_PACKAGE_PROVENANCE_STALE');
    }
  }

  if (socialPackage.imageAssetId === null || visualAsset === null) {
    deferReasons.push('VALIDATED_SOCIAL_VISUAL_REQUIRED');
  } else {
    if (visualAsset.id !== socialPackage.imageAssetId) {
      blockReasons.push('SOCIAL_VISUAL_ID_MISMATCH');
    }
    if (visualAsset.organizationId !== story.organizationId) {
      blockReasons.push('SOCIAL_VISUAL_ORGANIZATION_MISMATCH');
    }
    if (visualAsset.canonicalStoryId !== story.id) {
      blockReasons.push('SOCIAL_VISUAL_STORY_MISMATCH');
    }
    if (visualAsset.aspectRatio !== '16:9') {
      blockReasons.push('SOCIAL_VISUAL_ASPECT_RATIO_MISMATCH');
    }
    if (visualAsset.status !== VisualAssetStatus.VALIDATED || !visualAsset.assetUrl?.trim()) {
      deferReasons.push('SOCIAL_VISUAL_NOT_VALIDATED');
    }
  }

  if (blockReasons.length > 0) {
    return {
      decision: SocialReadinessDecision.BLOCK,
      reasons: blockReasons,
      measuredCharacterCount: length.measuredCharacterCount,
      lengthBand: length.band,
    };
  }

  if (deferReasons.length > 0) {
    return {
      decision: SocialReadinessDecision.DEFER,
      reasons: deferReasons,
      measuredCharacterCount: length.measuredCharacterCount,
      lengthBand: length.band,
    };
  }

  if (story.riskLevel === RiskLevel.HIGH) {
    reviewReasons.push('HIGH_RISK_REQUIRES_HUMAN_REVIEW');
  }
  if (
    story.verificationConfidence !== VerificationConfidence.HIGH &&
    story.verificationConfidence !== VerificationConfidence.VERY_HIGH
  ) {
    reviewReasons.push('HIGH_OR_VERY_HIGH_VERIFICATION_REQUIRED');
  }
  if (
    length.band === SocialCopyLengthBand.WARNING ||
    length.band === SocialCopyLengthBand.HIGH
  ) {
    reviewReasons.push('SOCIAL_COPY_OUTSIDE_TARGET_RANGE');
  }
  if (socialPackage.status === SocialPackageStatus.SENT) {
    reviewReasons.push('LEGACY_SENT_STATUS_REQUIRES_REVIEW');
  }

  if (reviewReasons.length > 0) {
    return {
      decision: SocialReadinessDecision.REVIEW,
      reasons: reviewReasons,
      measuredCharacterCount: length.measuredCharacterCount,
      lengthBand: length.band,
    };
  }

  return {
    decision: SocialReadinessDecision.READY,
    reasons: [],
    measuredCharacterCount: length.measuredCharacterCount,
    lengthBand: length.band,
  };
};
