import { CanonicalStoryStatus, type CanonicalStory } from '../../domain/editorial/canonical-story';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { editorialBandFromScore, evaluateBreakingEligibility } from '../../domain/editorial/scoring';
import type { EditorialQueueSource } from '../../domain/editorial/editorial-queue';
import { PublicationStatus } from '../../domain/publications/publication';
import { canTransitionCanonicalStory } from '../../domain/state-machine/state-machine';
import type { IsoUtcDateTime } from '../../domain/common/types';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import {
  FIRESTORE_EDITORIAL_ROOT_COLLECTION,
  FIRESTORE_EDITORIAL_STORIES_COLLECTION,
} from '../editorial/firestore-persistence';

export interface LiveEditorialQueueSource extends EditorialQueueSource {
  readonly canonicalStory: CanonicalStory;
  readonly origin: 'LIVE_NEWS_PIPELINE';
}

const isLiveEditorialQueueSource = (value: unknown): value is LiveEditorialQueueSource => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.origin === 'LIVE_NEWS_PIPELINE'
    && typeof record.storyId === 'string'
    && typeof record.revision === 'string'
    && typeof record.headline === 'string'
    && typeof record.slug === 'string'
    && !!record.snapshot
    && typeof record.snapshot === 'object'
    && !!record.canonicalStory
    && typeof record.canonicalStory === 'object';
};

const storyReference = (firestore: FirestoreClientLike, story: CanonicalStory) =>
  firestore.collection(FIRESTORE_EDITORIAL_ROOT_COLLECTION)
    .doc(story.organizationId)
    .collection(FIRESTORE_EDITORIAL_STORIES_COLLECTION)
    .doc(String(story.id));

export const createFirestoreLiveEditorialSink = ({ firestore }: { readonly firestore: FirestoreClientLike }) => ({
  async persistReadyForReview(story: CanonicalStory, reasons: readonly string[]): Promise<boolean> {
    const transition = canTransitionCanonicalStory(story.status, CanonicalStoryStatus.READY_FOR_REVIEW);
    if (!transition.ok) throw new Error('LIVE_EDITORIAL_READY_FOR_REVIEW_TRANSITION_INVALID');

    const readyStory: CanonicalStory = {
      ...story,
      status: CanonicalStoryStatus.READY_FOR_REVIEW,
      updatedAt: story.updatedAt,
    };
    const editorialGate = {
      decision: IntegratedEditorialDecision.ALLOW_EDITORIAL,
      editorialBand: editorialBandFromScore(story.orbiScore),
      reasons: reasons.length > 0 ? [...reasons] : ['EDITORIAL_GATE_REQUIREMENTS_SATISFIED'],
    };
    const breakingEligibility = evaluateBreakingEligibility({
      orbiScore: story.orbiScore,
      socialScore: story.socialScore,
      verificationConfidence: story.verificationConfidence,
      riskLevel: story.riskLevel,
      verificationAllowed: true,
      eventResolved: true,
      hasContradiction: false,
    });
    const source: LiveEditorialQueueSource = {
      storyId: story.id,
      revision: `live-${story.id}`,
      headline: story.headline,
      slug: story.slug,
      category: story.primaryCategory,
      riskLevel: story.riskLevel,
      verificationConfidence: story.verificationConfidence,
      orbiScore: story.orbiScore,
      updatedAt: story.updatedAt,
      snapshot: {
        storyStatus: CanonicalStoryStatus.READY_FOR_REVIEW,
        publicationStatus: PublicationStatus.NOT_SCHEDULED,
        editorialGate,
        breakingEligibility,
        isBreaking: false,
      },
      canonicalStory: readyStory,
      origin: 'LIVE_NEWS_PIPELINE',
    };

    const reference = storyReference(firestore, story);
    return firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) return false;
      transaction.create(reference, source);
      return true;
    });
  },

  async markPublished(publishedStory: CanonicalStory, publishedAt: IsoUtcDateTime): Promise<boolean> {
    if (publishedStory.status !== CanonicalStoryStatus.PUBLISHED) {
      throw new Error('LIVE_EDITORIAL_PUBLISHED_STORY_REQUIRED');
    }
    const reference = storyReference(firestore, publishedStory);
    return firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (!existing.exists) throw new Error('LIVE_EDITORIAL_STORY_NOT_FOUND');
      const current = existing.data();
      if (!isLiveEditorialQueueSource(current)) throw new Error('LIVE_EDITORIAL_INVALID_QUEUE_SOURCE');
      if (current.snapshot.storyStatus === CanonicalStoryStatus.PUBLISHED) return false;

      transaction.set(reference, {
        ...current,
        revision: `${current.revision}-published`,
        updatedAt: publishedAt,
        snapshot: {
          ...current.snapshot,
          storyStatus: CanonicalStoryStatus.PUBLISHED,
          publicationStatus: PublicationStatus.PUBLISHED,
        },
        canonicalStory: {
          ...publishedStory,
          status: CanonicalStoryStatus.PUBLISHED,
          publishedAt,
          updatedAt: publishedAt,
        },
      });
      return true;
    });
  },
});
