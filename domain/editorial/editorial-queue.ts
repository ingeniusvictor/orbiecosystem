import { ContentCategory, RiskLevel, VerificationConfidence } from '../common/enums';
import type { CanonicalStoryId, IsoUtcDateTime } from '../common/types';
import { CanonicalStoryStatus } from './canonical-story';
import {
  EditorialControlAction,
  type EditorialActionAssessment,
  type EditorialControlSnapshot,
  type EditorialRole,
  assessEditorialControlAction,
} from './control-center';
import { IntegratedEditorialDecision } from './editorial-gate';
import { PublicationStatus } from '../publications/publication';

export enum EditorialQueueBucket {
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  BLOCKED = 'BLOCKED',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHING = 'PUBLISHING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
  DRAFTING = 'DRAFTING',
}

export interface EditorialQueueSource {
  readonly storyId: CanonicalStoryId;
  readonly revision: string;
  readonly headline: string;
  readonly slug: string;
  readonly category: ContentCategory;
  readonly riskLevel: RiskLevel;
  readonly verificationConfidence: VerificationConfidence;
  readonly orbiScore: number;
  readonly updatedAt: IsoUtcDateTime;
  readonly snapshot: EditorialControlSnapshot;
}

export interface EditorialQueueItem {
  readonly storyId: CanonicalStoryId;
  readonly revision: string;
  readonly headline: string;
  readonly slug: string;
  readonly category: ContentCategory;
  readonly riskLevel: RiskLevel;
  readonly verificationConfidence: VerificationConfidence;
  readonly orbiScore: number;
  readonly updatedAt: IsoUtcDateTime;
  readonly bucket: EditorialQueueBucket;
  readonly requiresHumanAttention: boolean;
  readonly attentionReasons: readonly string[];
  readonly actionAssessments: readonly EditorialActionAssessment[];
}

const deriveBucket = (source: EditorialQueueSource): EditorialQueueBucket => {
  const { storyStatus, publicationStatus, editorialGate } = source.snapshot;

  if (
    storyStatus === CanonicalStoryStatus.BLOCKED ||
    editorialGate.decision === IntegratedEditorialDecision.BLOCK ||
    publicationStatus === PublicationStatus.BLOCKED
  ) return EditorialQueueBucket.BLOCKED;

  if (
    storyStatus === CanonicalStoryStatus.FAILED ||
    publicationStatus === PublicationStatus.FAILED ||
    publicationStatus === PublicationStatus.RETRY_PENDING
  ) return EditorialQueueBucket.FAILED;

  if (
    storyStatus === CanonicalStoryStatus.PUBLISHED ||
    publicationStatus === PublicationStatus.PUBLISHED
  ) return EditorialQueueBucket.PUBLISHED;

  if (publicationStatus === PublicationStatus.PUBLISHING) return EditorialQueueBucket.PUBLISHING;
  if (publicationStatus === PublicationStatus.SCHEDULED) return EditorialQueueBucket.SCHEDULED;
  if (storyStatus === CanonicalStoryStatus.APPROVED) return EditorialQueueBucket.APPROVED;

  if (
    storyStatus === CanonicalStoryStatus.READY_FOR_REVIEW ||
    editorialGate.decision === IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW
  ) return EditorialQueueBucket.NEEDS_REVIEW;

  return EditorialQueueBucket.DRAFTING;
};

const deriveAttentionReasons = (source: EditorialQueueSource): readonly string[] => {
  const reasons: string[] = [];
  const { editorialGate, publicationStatus } = source.snapshot;

  if (editorialGate.decision === IntegratedEditorialDecision.BLOCK) {
    reasons.push('EDITORIAL_BLOCKED', ...editorialGate.reasons);
  }
  if (editorialGate.decision === IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW) {
    reasons.push('HUMAN_REVIEW_REQUIRED', ...editorialGate.reasons);
  }
  if (source.riskLevel === RiskLevel.HIGH || source.riskLevel === RiskLevel.CRITICAL) {
    reasons.push('ELEVATED_RISK');
  }
  if (publicationStatus === PublicationStatus.FAILED || publicationStatus === PublicationStatus.RETRY_PENDING) {
    reasons.push('PUBLICATION_FAILURE');
  }
  if (publicationStatus === PublicationStatus.BLOCKED) reasons.push('PUBLICATION_BLOCKED');

  return [...new Set(reasons)];
};

const bucketPriority: Readonly<Record<EditorialQueueBucket, number>> = {
  [EditorialQueueBucket.BLOCKED]: 0,
  [EditorialQueueBucket.FAILED]: 1,
  [EditorialQueueBucket.NEEDS_REVIEW]: 2,
  [EditorialQueueBucket.APPROVED]: 3,
  [EditorialQueueBucket.SCHEDULED]: 4,
  [EditorialQueueBucket.PUBLISHING]: 5,
  [EditorialQueueBucket.DRAFTING]: 6,
  [EditorialQueueBucket.PUBLISHED]: 7,
};

export const buildEditorialQueueItem = (
  role: EditorialRole,
  source: EditorialQueueSource,
): EditorialQueueItem => {
  const attentionReasons = deriveAttentionReasons(source);
  return {
    storyId: source.storyId,
    revision: source.revision,
    headline: source.headline,
    slug: source.slug,
    category: source.category,
    riskLevel: source.riskLevel,
    verificationConfidence: source.verificationConfidence,
    orbiScore: source.orbiScore,
    updatedAt: source.updatedAt,
    bucket: deriveBucket(source),
    requiresHumanAttention: attentionReasons.length > 0,
    attentionReasons,
    actionAssessments: Object.values(EditorialControlAction).map((action) =>
      assessEditorialControlAction(role, action, source.snapshot),
    ),
  };
};

export const buildEditorialQueue = (
  role: EditorialRole,
  sources: readonly EditorialQueueSource[],
): readonly EditorialQueueItem[] =>
  sources
    .map((source) => buildEditorialQueueItem(role, source))
    .sort((a, b) => {
      const bucketDelta = bucketPriority[a.bucket] - bucketPriority[b.bucket];
      if (bucketDelta !== 0) return bucketDelta;
      const scoreDelta = b.orbiScore - a.orbiScore;
      if (scoreDelta !== 0) return scoreDelta;
      return b.updatedAt.localeCompare(a.updatedAt);
    });

export const filterEditorialQueue = (
  items: readonly EditorialQueueItem[],
  bucket: EditorialQueueBucket | null,
): readonly EditorialQueueItem[] =>
  bucket === null ? items : items.filter((item) => item.bucket === bucket);
