import type { IsoUtcDateTime } from '../../domain/common/types';
import { CanonicalStoryStatus, type CanonicalStory } from '../../domain/editorial/canonical-story';
import type { OperationalAuthoritySnapshot } from '../../domain/operations/operational-authority';
import { canTransitionCanonicalStory } from '../../domain/state-machine/state-machine';
import type { PublishedNewsSourceRecord } from '../../domain/publications/public-news';
import type { PublicNewsWriter } from './firestore-public-news-store';
import { assessAutonomousWebPublishing } from './autonomous-web-publishing-policy';
import { publishApprovedStoryToWeb, type VercelWebPublicationResult } from '../vercel/web-publication-service';

export interface AutonomousWebPublicationResult {
  readonly outcome: VercelWebPublicationResult['outcome'] | 'REVIEW_REQUIRED';
  readonly reasons: readonly string[];
  readonly approvedStory: CanonicalStory | null;
  readonly publishedStory: CanonicalStory | null;
}

export const publishStoryAutonomouslyIfEligible = async ({
  story,
  writer,
  existingRecords,
  authoritySnapshot,
  nowUtc,
}: {
  readonly story: CanonicalStory;
  readonly writer: PublicNewsWriter;
  readonly existingRecords: readonly PublishedNewsSourceRecord[];
  readonly authoritySnapshot: OperationalAuthoritySnapshot;
  readonly nowUtc: IsoUtcDateTime;
}): Promise<AutonomousWebPublicationResult> => {
  const policy = assessAutonomousWebPublishing(story);
  if (!policy.eligible) {
    return {
      outcome: 'REVIEW_REQUIRED',
      reasons: policy.reasons,
      approvedStory: null,
      publishedStory: null,
    };
  }

  const reviewTransition = story.status === CanonicalStoryStatus.DRAFT_READY
    ? canTransitionCanonicalStory(CanonicalStoryStatus.DRAFT_READY, CanonicalStoryStatus.READY_FOR_REVIEW)
    : { ok: true as const };
  if (!reviewTransition.ok) throw new Error('AUTONOMOUS_WEB_READY_FOR_REVIEW_TRANSITION_INVALID');

  const approvalTransition = canTransitionCanonicalStory(CanonicalStoryStatus.READY_FOR_REVIEW, CanonicalStoryStatus.APPROVED);
  if (!approvalTransition.ok) throw new Error('AUTONOMOUS_WEB_APPROVAL_TRANSITION_INVALID');

  const approvedStory: CanonicalStory = {
    ...story,
    status: CanonicalStoryStatus.APPROVED,
    updatedAt: nowUtc,
  };

  const publication = await publishApprovedStoryToWeb({
    story: approvedStory,
    writer,
    existingRecords,
    authoritySnapshot,
    publishingEnabled: true,
    channelEnabled: true,
    retryCount: 0,
    maxRetries: 3,
    nowUtc,
  });

  if (publication.outcome !== 'PUBLISHED' && publication.outcome !== 'ALREADY_PUBLISHED') {
    return {
      outcome: publication.outcome,
      reasons: publication.reasons,
      approvedStory,
      publishedStory: null,
    };
  }

  const publishTransition = canTransitionCanonicalStory(CanonicalStoryStatus.APPROVED, CanonicalStoryStatus.PUBLISHED);
  if (!publishTransition.ok) throw new Error('AUTONOMOUS_WEB_PUBLISHED_TRANSITION_INVALID');
  return {
    outcome: publication.outcome,
    reasons: publication.reasons,
    approvedStory,
    publishedStory: {
      ...approvedStory,
      status: CanonicalStoryStatus.PUBLISHED,
      publishedAt: publication.record?.article.publishedAt ?? nowUtc,
      updatedAt: publication.record?.article.publishedAt ?? nowUtc,
    },
  };
};
