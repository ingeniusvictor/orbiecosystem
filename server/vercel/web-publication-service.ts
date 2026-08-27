import { ContentFormat, CanonicalStoryStatus, type CanonicalStory } from '../../domain/editorial/canonical-story';
import type { IsoUtcDateTime } from '../../domain/common/types';
import { OperationalAction, OperationalDecision, assessOperationalAuthority, type OperationalAuthoritySnapshot } from '../../domain/operations/operational-authority';
import { PublicationChannel, PublicationStatus } from '../../domain/publications/publication';
import { PublicationDecision, evaluatePublicationGate } from '../../domain/publications/policy';
import type { PublishedNewsSourceRecord } from '../../domain/publications/public-news';
import type { PublicNewsWriter } from '../news/firestore-public-news-store';

export interface VercelWebPublicationResult {
  readonly outcome: 'PUBLISHED' | 'ALREADY_PUBLISHED' | 'DEFERRED' | 'BLOCKED' | 'REVIEW_REQUIRED';
  readonly reasons: readonly string[];
  readonly record: PublishedNewsSourceRecord | null;
}

export const publishApprovedStoryToWeb = async ({
  story,
  writer,
  existingRecords,
  authoritySnapshot,
  publishingEnabled,
  channelEnabled,
  retryCount,
  maxRetries,
  nowUtc,
}: {
  readonly story: CanonicalStory;
  readonly writer: PublicNewsWriter;
  readonly existingRecords: readonly PublishedNewsSourceRecord[];
  readonly authoritySnapshot: OperationalAuthoritySnapshot;
  readonly publishingEnabled: boolean;
  readonly channelEnabled: boolean;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly nowUtc: IsoUtcDateTime;
}): Promise<VercelWebPublicationResult> => {
  const existing = existingRecords.find((record) => record.article.id === story.id || record.article.slug === story.slug);
  if (existing) return { outcome: 'ALREADY_PUBLISHED', reasons: ['PUBLIC_NEWS_ARTICLE_ALREADY_EXISTS'], record: existing };

  const authority = assessOperationalAuthority(OperationalAction.PUBLISH_WEB, authoritySnapshot);
  if (authority.decision === OperationalDecision.BLOCK) return { outcome: 'BLOCKED', reasons: authority.reasons, record: null };
  if (authority.decision === OperationalDecision.DEFER) return { outcome: 'DEFERRED', reasons: authority.reasons, record: null };

  const publicationGate = evaluatePublicationGate({
    story,
    channel: PublicationChannel.ORBI_WEB,
    currentStatus: PublicationStatus.READY,
    systemMode: authoritySnapshot.systemMode,
    publishingEnabled,
    channelEnabled,
    duplicateIdempotencyKeyExists: false,
    retryCount,
    maxRetries,
  });
  if (publicationGate.decision === PublicationDecision.BLOCK) return { outcome: 'BLOCKED', reasons: publicationGate.reasons, record: null };
  if (publicationGate.decision === PublicationDecision.DEFER) return { outcome: 'DEFERRED', reasons: publicationGate.reasons, record: null };
  if (publicationGate.decision === PublicationDecision.REQUIRE_REVIEW) return { outcome: 'REVIEW_REQUIRED', reasons: publicationGate.reasons, record: null };

  const record: PublishedNewsSourceRecord = {
    storyStatus: CanonicalStoryStatus.PUBLISHED,
    publicationStatus: PublicationStatus.PUBLISHED,
    publicationChannel: PublicationChannel.ORBI_WEB,
    article: {
      id: story.id,
      slug: story.slug,
      headline: story.headline,
      dek: story.dek,
      category: story.primaryCategory,
      publishedAt: nowUtc,
      imageUrl: null,
      imageAlt: null,
      isBreaking: story.format === ContentFormat.BREAKING_NEWS,
      sections: story.sections.map((section) => ({ key: section.key, heading: section.heading, body: section.body })),
      sources: story.sourceRefs.map((source) => ({ label: source.label, url: source.url, isPrimary: source.isPrimary })),
    },
  };
  await writer.publish(record);
  return { outcome: 'PUBLISHED', reasons: [], record };
};
