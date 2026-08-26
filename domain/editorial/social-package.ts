import type {
  CanonicalStoryId,
  IsoUtcDateTime,
  OrganizationId,
  SocialPackageId,
} from '../common/types';
import type { VisualAssetId } from '../visuals/visual-asset';

export enum SocialPackageStatus {
  NOT_STARTED = 'NOT_STARTED',
  GENERATING = 'GENERATING',
  DRAFT = 'DRAFT',
  READY = 'READY',
  BLOCKED = 'BLOCKED',
  FAILED = 'FAILED',
  /** @deprecated Delivery state is tracked separately from content readiness. */
  SENT = 'SENT',
}

export enum SocialPlatform {
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
}

export enum SocialContentSection {
  HOOK = 'HOOK',
  WHAT_HAPPENED = 'WHAT_HAPPENED',
  WHY_IT_MATTERS = 'WHY_IT_MATTERS',
  PRACTICAL_IMPLICATION = 'PRACTICAL_IMPLICATION',
  ORBI_LENS = 'ORBI_LENS',
  CTA = 'CTA',
}

export interface SocialSectionContent {
  readonly section: SocialContentSection;
  readonly text: string;
}

export interface SocialPackageProvenance {
  readonly canonicalStoryId: CanonicalStoryId;
  /** Opaque revision of the canonical story used to produce this package. */
  readonly canonicalStoryRevision: string;
  /** Public ORBI News article URL. Web publication remains the primary publication. */
  readonly webArticleUrl: string;
}

export interface SocialPackage {
  readonly id: SocialPackageId;
  readonly organizationId: OrganizationId;
  readonly canonicalStoryId: CanonicalStoryId;
  readonly status: SocialPackageStatus;
  readonly targetPlatforms: readonly SocialPlatform[];
  readonly socialHeadline: string;
  /** Ordered editorial components used to assemble the final social copy. */
  readonly sections: readonly SocialSectionContent[];
  /** Final platform-neutral V1 copy. Deterministic length policy is applied separately. */
  readonly copy: string;
  readonly hashtags: readonly string[];
  readonly characterCount: number;
  readonly imageAspectRatio: '16:9';
  readonly imageAssetId: VisualAssetId | null;
  readonly webArticleUrl: string | null;
  readonly provenance: SocialPackageProvenance | null;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
}

export const SOCIAL_COPY_HARD_LIMIT = 2200;
export const SOCIAL_COPY_WARNING_MAX = 2100;
export const SOCIAL_COPY_TARGET_MIN = 1500;
export const SOCIAL_COPY_TARGET_MAX = 1900;

export const SOCIAL_PACKAGE_REQUIRED_SECTIONS: readonly SocialContentSection[] = [
  SocialContentSection.HOOK,
  SocialContentSection.WHAT_HAPPENED,
  SocialContentSection.WHY_IT_MATTERS,
  SocialContentSection.PRACTICAL_IMPLICATION,
  SocialContentSection.ORBI_LENS,
  SocialContentSection.CTA,
];

export const SOCIAL_PACKAGE_V1_PLATFORMS: readonly SocialPlatform[] = [
  SocialPlatform.FACEBOOK,
  SocialPlatform.INSTAGRAM,
];

export const isSocialCopyWithinHardLimit = (copy: string): boolean =>
  [...copy].length <= SOCIAL_COPY_HARD_LIMIT;
