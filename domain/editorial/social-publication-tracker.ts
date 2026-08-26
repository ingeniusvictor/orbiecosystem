import type {
  IsoUtcDateTime,
  OrganizationId,
  SocialPackageId,
} from '../common/types';
import {
  SOCIAL_PACKAGE_V1_PLATFORMS,
  SocialPackageStatus,
  SocialPlatform,
  type SocialPackage,
} from './social-package';

export enum ManualPublicationStatus {
  NOT_POSTED = 'NOT_POSTED',
  POSTED = 'POSTED',
  FAILED = 'FAILED',
}

export interface ManualPublicationActor {
  readonly actorId: string;
  readonly displayName: string;
}

export interface ManualPlatformPublication {
  readonly platform: SocialPlatform;
  readonly status: ManualPublicationStatus;
  readonly postUrl: string | null;
  readonly actor: ManualPublicationActor | null;
  readonly postedAt: IsoUtcDateTime | null;
  readonly updatedAt: IsoUtcDateTime;
  readonly failureReason: string | null;
}

export interface ManualPublicationTracker {
  readonly organizationId: OrganizationId;
  readonly socialPackageId: SocialPackageId;
  readonly packageRevision: string;
  readonly platforms: Readonly<Record<SocialPlatform, ManualPlatformPublication>>;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
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
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new RangeError(`${label} must be an absolute HTTP(S) URL.`);
  }
  return parsed.toString();
};

const normalizeActor = (actor: ManualPublicationActor): ManualPublicationActor => ({
  actorId: normalizeRequired('Manual publication actorId', actor.actorId),
  displayName: normalizeRequired('Manual publication displayName', actor.displayName),
});

export const createManualPublicationTracker = (
  socialPackage: SocialPackage,
  packageRevision: string,
  createdAt: IsoUtcDateTime,
): ManualPublicationTracker => {
  if (socialPackage.status !== SocialPackageStatus.READY) {
    throw new RangeError('MANUAL_PUBLICATION_TRACKER_REQUIRES_READY_PACKAGE');
  }
  const revision = normalizeRequired('Social package revision', packageRevision);

  const platforms = Object.fromEntries(
    SOCIAL_PACKAGE_V1_PLATFORMS.map((platform) => [
      platform,
      {
        platform,
        status: ManualPublicationStatus.NOT_POSTED,
        postUrl: null,
        actor: null,
        postedAt: null,
        updatedAt: createdAt,
        failureReason: null,
      } satisfies ManualPlatformPublication,
    ]),
  ) as Record<SocialPlatform, ManualPlatformPublication>;

  return {
    organizationId: socialPackage.organizationId,
    socialPackageId: socialPackage.id,
    packageRevision: revision,
    platforms,
    createdAt,
    updatedAt: createdAt,
  };
};

export interface MarkManualPublicationPostedInput {
  readonly tracker: ManualPublicationTracker;
  readonly socialPackage: SocialPackage;
  readonly packageRevision: string;
  readonly platform: SocialPlatform;
  readonly postUrl: string;
  readonly actor: ManualPublicationActor;
  readonly postedAt: IsoUtcDateTime;
}

export const markManualPublicationPosted = (
  input: MarkManualPublicationPostedInput,
): ManualPublicationTracker => {
  if (input.socialPackage.status !== SocialPackageStatus.READY) {
    throw new RangeError('MANUAL_PUBLICATION_REQUIRES_READY_PACKAGE');
  }
  if (input.tracker.organizationId !== input.socialPackage.organizationId) {
    throw new RangeError('MANUAL_PUBLICATION_ORGANIZATION_MISMATCH');
  }
  if (input.tracker.socialPackageId !== input.socialPackage.id) {
    throw new RangeError('MANUAL_PUBLICATION_PACKAGE_MISMATCH');
  }
  const revision = normalizeRequired('Social package revision', input.packageRevision);
  if (input.tracker.packageRevision !== revision) {
    throw new RangeError('MANUAL_PUBLICATION_PACKAGE_REVISION_STALE');
  }
  if (!SOCIAL_PACKAGE_V1_PLATFORMS.includes(input.platform)) {
    throw new RangeError('MANUAL_PUBLICATION_PLATFORM_UNSUPPORTED');
  }

  const existing = input.tracker.platforms[input.platform];
  const postUrl = normalizeHttpUrl('Manual publication post URL', input.postUrl);
  const actor = normalizeActor(input.actor);

  if (existing.status === ManualPublicationStatus.POSTED) {
    const sameActor =
      existing.actor?.actorId === actor.actorId &&
      existing.actor?.displayName === actor.displayName;
    if (existing.postUrl === postUrl && sameActor && existing.postedAt === input.postedAt) {
      return input.tracker;
    }
    throw new RangeError('MANUAL_PUBLICATION_DUPLICATE_POST_REQUIRES_EXPLICIT_REVIEW');
  }

  const updated: ManualPlatformPublication = {
    platform: input.platform,
    status: ManualPublicationStatus.POSTED,
    postUrl,
    actor,
    postedAt: input.postedAt,
    updatedAt: input.postedAt,
    failureReason: null,
  };

  return {
    ...input.tracker,
    platforms: { ...input.tracker.platforms, [input.platform]: updated },
    updatedAt: input.postedAt,
  };
};

export interface MarkManualPublicationFailedInput {
  readonly tracker: ManualPublicationTracker;
  readonly socialPackage: SocialPackage;
  readonly packageRevision: string;
  readonly platform: SocialPlatform;
  readonly actor: ManualPublicationActor;
  readonly failureReason: string;
  readonly failedAt: IsoUtcDateTime;
}

export const markManualPublicationFailed = (
  input: MarkManualPublicationFailedInput,
): ManualPublicationTracker => {
  if (input.tracker.organizationId !== input.socialPackage.organizationId) {
    throw new RangeError('MANUAL_PUBLICATION_ORGANIZATION_MISMATCH');
  }
  if (input.tracker.socialPackageId !== input.socialPackage.id) {
    throw new RangeError('MANUAL_PUBLICATION_PACKAGE_MISMATCH');
  }
  const revision = normalizeRequired('Social package revision', input.packageRevision);
  if (input.tracker.packageRevision !== revision) {
    throw new RangeError('MANUAL_PUBLICATION_PACKAGE_REVISION_STALE');
  }
  const existing = input.tracker.platforms[input.platform];
  if (existing.status === ManualPublicationStatus.POSTED) {
    throw new RangeError('MANUAL_PUBLICATION_POSTED_STATE_IMMUTABLE');
  }

  const updated: ManualPlatformPublication = {
    platform: input.platform,
    status: ManualPublicationStatus.FAILED,
    postUrl: null,
    actor: normalizeActor(input.actor),
    postedAt: null,
    updatedAt: input.failedAt,
    failureReason: normalizeRequired('Manual publication failure reason', input.failureReason),
  };

  return {
    ...input.tracker,
    platforms: { ...input.tracker.platforms, [input.platform]: updated },
    updatedAt: input.failedAt,
  };
};

export const isManualPublicationComplete = (tracker: ManualPublicationTracker): boolean =>
  SOCIAL_PACKAGE_V1_PLATFORMS.every(
    (platform) => tracker.platforms[platform].status === ManualPublicationStatus.POSTED,
  );
