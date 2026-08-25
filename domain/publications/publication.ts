import type { CanonicalStoryId, IsoUtcDateTime, OrganizationId, PublicationId, SocialPackageId } from '../common/types';

export enum PublicationChannel {
  ORBI_WEB = 'ORBI_WEB',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  LINKEDIN = 'LINKEDIN',
  YOUTUBE_COMMUNITY = 'YOUTUBE_COMMUNITY',
  X = 'X',
  THREADS = 'THREADS',
}

export enum PublicationStatus {
  NOT_SCHEDULED = 'NOT_SCHEDULED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  READY = 'READY',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  RETRY_PENDING = 'RETRY_PENDING',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED',
}

export enum ManualSocialStatus {
  NOT_PREPARED = 'NOT_PREPARED',
  PACKAGE_READY = 'PACKAGE_READY',
  EMAIL_SENT = 'EMAIL_SENT',
  POSTED = 'POSTED',
  SKIPPED = 'SKIPPED',
}

export interface PublicationIdempotencyKey {
  readonly value: string;
  readonly channel: PublicationChannel;
  readonly storyId: CanonicalStoryId;
  readonly accountId: string;
  readonly slotKey: string;
}

export interface PublicationRecord {
  readonly id: PublicationId;
  readonly organizationId: OrganizationId;
  readonly storyId: CanonicalStoryId;
  readonly socialPackageId: SocialPackageId | null;
  readonly channel: PublicationChannel;
  readonly accountId: string;
  readonly status: PublicationStatus;
  readonly idempotencyKey: PublicationIdempotencyKey;
  readonly scheduledAt: IsoUtcDateTime | null;
  readonly publishStartedAt: IsoUtcDateTime | null;
  readonly publishedAt: IsoUtcDateTime | null;
  readonly externalPostId: string | null;
  readonly externalUrl: string | null;
  readonly retryCount: number;
  readonly lastErrorCode: string | null;
  readonly lastErrorMessage: string | null;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
}

export interface ManualSocialPublicationRecord {
  readonly organizationId: OrganizationId;
  readonly storyId: CanonicalStoryId;
  readonly socialPackageId: SocialPackageId;
  readonly channel: PublicationChannel.FACEBOOK | PublicationChannel.INSTAGRAM;
  readonly status: ManualSocialStatus;
  readonly emailSentAt: IsoUtcDateTime | null;
  readonly markedPostedAt: IsoUtcDateTime | null;
  readonly markedPostedBy: string | null;
  readonly externalUrl: string | null;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
}
