import type { ContentCategory, RiskLevel, VerificationConfidence } from '../common/enums';
import type { CanonicalStoryId, SocialPackageId } from '../common/types';
import { VisualAssetStatus, type VisualAsset, type VisualAssetId } from '../visuals/visual-asset';
import { CanonicalStoryStatus, type CanonicalStory, type CanonicalStorySourceRef } from './canonical-story';
import { countSocialCopyCharacters } from './social-length-policy';
import { SocialEmailStatus, type SocialMailerJob } from './social-mailer';
import { SocialPackageStatus, type SocialPackage } from './social-package';

export interface SocialEmailPublicPackage {
  readonly publishedStatus: CanonicalStoryStatus.PUBLISHED;
  readonly headline: string;
  readonly orbiScore: number;
  readonly category: ContentCategory;
  readonly socialCopy: string;
  readonly characterCount: number;
  readonly hashtags: readonly string[];
  readonly imageAssetId: VisualAssetId;
  readonly imageUrl: string;
  readonly articleUrl: string;
}

export interface SocialEmailPrivateVerificationBlock {
  readonly verificationConfidence: VerificationConfidence;
  readonly riskLevel: RiskLevel;
  readonly canonicalStoryId: CanonicalStoryId;
  readonly socialPackageId: SocialPackageId;
  readonly canonicalStoryRevision: string;
  readonly socialPackageRevision: string;
  readonly sources: readonly CanonicalStorySourceRef[];
}

export interface SocialEmailPackage {
  readonly mailerJobId: SocialMailerJob['id'];
  readonly recipient: string;
  readonly subject: string;
  readonly publicPackage: SocialEmailPublicPackage;
  readonly privateVerification: SocialEmailPrivateVerificationBlock;
}

export interface GenerateSocialEmailPackageInput {
  readonly story: CanonicalStory;
  readonly storyRevision: string;
  readonly socialPackage: SocialPackage;
  readonly socialPackageRevision: string;
  readonly visualAsset: VisualAsset;
  readonly mailerJob: SocialMailerJob;
}

const normalizeRequired = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label} is required.`);
  return normalized;
};

const normalizeHttpUrl = (label: string, value: string): string => {
  const normalized = normalizeRequired(label, value);
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new RangeError(`${label} must be an absolute HTTP(S) URL.`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new RangeError(`${label} must be an absolute HTTP(S) URL.`);
  }
  return parsed.toString();
};

/**
 * Builds the complete deterministic email payload only.
 * It does not mutate the mailer job, send email, or change social readiness.
 */
export const generateSocialEmailPackage = (
  input: GenerateSocialEmailPackageInput,
): SocialEmailPackage => {
  const { story, socialPackage, visualAsset, mailerJob } = input;

  if (story.status !== CanonicalStoryStatus.PUBLISHED || story.publishedAt === null) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_REQUIRES_PUBLISHED_STORY');
  }
  if (socialPackage.status !== SocialPackageStatus.READY) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_REQUIRES_READY_SOCIAL_PACKAGE');
  }
  if (
    mailerJob.status !== SocialEmailStatus.NOT_CREATED &&
    mailerJob.status !== SocialEmailStatus.GENERATING
  ) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_MAILER_STATUS_INVALID');
  }

  if (
    story.organizationId !== socialPackage.organizationId ||
    story.organizationId !== mailerJob.organizationId ||
    story.organizationId !== visualAsset.organizationId
  ) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_ORGANIZATION_MISMATCH');
  }
  if (
    socialPackage.canonicalStoryId !== story.id ||
    mailerJob.canonicalStoryId !== story.id ||
    visualAsset.canonicalStoryId !== story.id
  ) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_STORY_MISMATCH');
  }
  if (mailerJob.socialPackageId !== socialPackage.id) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_SOCIAL_PACKAGE_MISMATCH');
  }

  const storyRevision = normalizeRequired('Canonical story revision', input.storyRevision);
  const socialPackageRevision = normalizeRequired('Social package revision', input.socialPackageRevision);
  if (
    mailerJob.provenance.canonicalStoryRevision !== storyRevision ||
    mailerJob.provenance.socialPackageRevision !== socialPackageRevision ||
    mailerJob.provenance.canonicalStoryId !== story.id ||
    mailerJob.provenance.socialPackageId !== socialPackage.id
  ) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_PROVENANCE_STALE');
  }

  if (socialPackage.provenance === null) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_SOCIAL_PROVENANCE_REQUIRED');
  }
  if (
    socialPackage.provenance.canonicalStoryId !== story.id ||
    socialPackage.provenance.canonicalStoryRevision !== storyRevision
  ) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_SOCIAL_PROVENANCE_STALE');
  }

  if (socialPackage.imageAssetId === null || socialPackage.imageAssetId !== visualAsset.id) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_VISUAL_BINDING_MISMATCH');
  }
  if (visualAsset.status !== VisualAssetStatus.VALIDATED || visualAsset.aspectRatio !== '16:9') {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_REQUIRES_VALIDATED_16_9_VISUAL');
  }

  const imageUrl = normalizeHttpUrl('Social image URL', visualAsset.assetUrl ?? '');
  const articleUrl = normalizeHttpUrl('ORBI News article URL', socialPackage.webArticleUrl ?? '');
  if (
    socialPackage.provenance.webArticleUrl !== socialPackage.webArticleUrl ||
    socialPackage.provenance.webArticleUrl !== articleUrl
  ) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_ARTICLE_URL_MISMATCH');
  }

  const measuredCharacterCount = countSocialCopyCharacters(socialPackage.copy);
  if (measuredCharacterCount !== socialPackage.characterCount) {
    throw new RangeError('SOCIAL_EMAIL_PACKAGE_CHARACTER_COUNT_MISMATCH');
  }

  return {
    mailerJobId: mailerJob.id,
    recipient: mailerJob.recipient,
    subject: mailerJob.subject,
    publicPackage: {
      publishedStatus: CanonicalStoryStatus.PUBLISHED,
      headline: normalizeRequired('Canonical story headline', story.headline),
      orbiScore: story.orbiScore,
      category: story.primaryCategory,
      socialCopy: socialPackage.copy,
      characterCount: measuredCharacterCount,
      hashtags: [...socialPackage.hashtags],
      imageAssetId: visualAsset.id,
      imageUrl,
      articleUrl,
    },
    privateVerification: {
      verificationConfidence: story.verificationConfidence,
      riskLevel: story.riskLevel,
      canonicalStoryId: story.id,
      socialPackageId: socialPackage.id,
      canonicalStoryRevision: storyRevision,
      socialPackageRevision,
      sources: story.sourceRefs.map((source) => ({ ...source })),
    },
  };
};
