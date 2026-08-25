import type { CanonicalStoryId, IsoUtcDateTime, SocialPackageId } from '../common/types';

export enum SocialPackageStatus {
  NOT_STARTED = 'NOT_STARTED',
  GENERATING = 'GENERATING',
  READY = 'READY',
  SENT = 'SENT',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
}

export interface SocialPackage {
  readonly id: SocialPackageId;
  readonly canonicalStoryId: CanonicalStoryId;
  readonly status: SocialPackageStatus;
  readonly socialHeadline: string;
  readonly copy: string;
  readonly hashtags: readonly string[];
  readonly characterCount: number;
  readonly imageAspectRatio: '16:9';
  readonly imageAssetId: string | null;
  readonly webArticleUrl: string | null;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
}

export const SOCIAL_COPY_HARD_LIMIT = 2200;
export const SOCIAL_COPY_TARGET_MIN = 1500;
export const SOCIAL_COPY_TARGET_MAX = 1900;

export const isSocialCopyWithinHardLimit = (copy: string): boolean =>
  [...copy].length <= SOCIAL_COPY_HARD_LIMIT;
