import type {
  CanonicalStoryId,
  IsoUtcDateTime,
  OrganizationId,
  SocialPackageId,
} from '../common/types';
import {
  CanonicalStoryStatus,
  type CanonicalStory,
} from './canonical-story';
import {
  SocialPackageStatus,
  type SocialPackage,
} from './social-package';

export enum SocialEmailStatus {
  NOT_CREATED = 'NOT_CREATED',
  GENERATING = 'GENERATING',
  READY = 'READY',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface SocialMailerJobIdBrand {
  readonly SocialMailerJobId: unique symbol;
}

export type SocialMailerJobId = string & SocialMailerJobIdBrand;

export interface SocialMailerProvenance {
  readonly canonicalStoryId: CanonicalStoryId;
  readonly socialPackageId: SocialPackageId;
  readonly canonicalStoryRevision: string;
  readonly socialPackageRevision: string;
}

export interface SocialMailerJob {
  readonly id: SocialMailerJobId;
  readonly organizationId: OrganizationId;
  readonly canonicalStoryId: CanonicalStoryId;
  readonly socialPackageId: SocialPackageId;
  readonly status: SocialEmailStatus;
  readonly subject: string;
  readonly recipient: string;
  readonly provenance: SocialMailerProvenance;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
  readonly sentAt: IsoUtcDateTime | null;
  readonly failureReason: string | null;
}

export interface CreateSocialMailerJobInput {
  readonly id: SocialMailerJobId;
  readonly story: CanonicalStory;
  readonly storyRevision: string;
  readonly socialPackage: SocialPackage;
  readonly socialPackageRevision: string;
  readonly recipient: string;
  readonly createdAt: IsoUtcDateTime;
}

const normalizeRequired = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label} is required.`);
  return normalized;
};

const normalizeEmail = (value: string): string => {
  const normalized = normalizeRequired('Social mail recipient', value).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new RangeError('SOCIAL_MAIL_RECIPIENT_INVALID');
  }
  return normalized;
};

export const buildSocialMailerSubject = (story: CanonicalStory): string =>
  `ORBI News Ready — ${normalizeRequired('Canonical story headline', story.headline)}`;

/**
 * Creates the delivery job contract only. It does not generate an email body,
 * contact a provider, send mail, or mutate SocialPackage readiness.
 */
export const createSocialMailerJob = (input: CreateSocialMailerJobInput): SocialMailerJob => {
  if (input.story.status !== CanonicalStoryStatus.PUBLISHED || input.story.publishedAt === null) {
    throw new RangeError('SOCIAL_MAIL_REQUIRES_PUBLISHED_STORY');
  }
  if (input.socialPackage.status !== SocialPackageStatus.READY) {
    throw new RangeError('SOCIAL_MAIL_REQUIRES_READY_PACKAGE');
  }
  if (input.story.organizationId !== input.socialPackage.organizationId) {
    throw new RangeError('SOCIAL_MAIL_ORGANIZATION_MISMATCH');
  }
  if (input.story.id !== input.socialPackage.canonicalStoryId) {
    throw new RangeError('SOCIAL_MAIL_STORY_MISMATCH');
  }

  const storyRevision = normalizeRequired('Canonical story revision', input.storyRevision);
  const socialPackageRevision = normalizeRequired('Social package revision', input.socialPackageRevision);

  return {
    id: input.id,
    organizationId: input.story.organizationId,
    canonicalStoryId: input.story.id,
    socialPackageId: input.socialPackage.id,
    status: SocialEmailStatus.NOT_CREATED,
    subject: buildSocialMailerSubject(input.story),
    recipient: normalizeEmail(input.recipient),
    provenance: {
      canonicalStoryId: input.story.id,
      socialPackageId: input.socialPackage.id,
      canonicalStoryRevision: storyRevision,
      socialPackageRevision,
    },
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    sentAt: null,
    failureReason: null,
  };
};

export const canTransitionSocialEmailStatus = (
  from: SocialEmailStatus,
  to: SocialEmailStatus,
): boolean => {
  const allowed: Readonly<Record<SocialEmailStatus, readonly SocialEmailStatus[]>> = {
    [SocialEmailStatus.NOT_CREATED]: [SocialEmailStatus.GENERATING, SocialEmailStatus.FAILED],
    [SocialEmailStatus.GENERATING]: [SocialEmailStatus.READY, SocialEmailStatus.FAILED],
    [SocialEmailStatus.READY]: [SocialEmailStatus.SENDING, SocialEmailStatus.FAILED],
    [SocialEmailStatus.SENDING]: [SocialEmailStatus.SENT, SocialEmailStatus.FAILED],
    [SocialEmailStatus.SENT]: [],
    [SocialEmailStatus.FAILED]: [SocialEmailStatus.GENERATING],
  };

  return allowed[from].includes(to);
};
