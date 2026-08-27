import { CanonicalStoryStatus, type CanonicalStory } from '../../domain/editorial/canonical-story';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { editorialBandFromScore, evaluateBreakingEligibility } from '../../domain/editorial/scoring';
import type { EditorialQueueSource } from '../../domain/editorial/editorial-queue';
import { PublicationStatus } from '../../domain/publications/publication';
import { canTransitionCanonicalStory } from '../../domain/state-machine/state-machine';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import {
  FIRESTORE_EDITORIAL_ROOT_COLLECTION,
  FIRESTORE_EDITORIAL_STORIES_COLLECTION,
} from '../editorial/firestore-persistence';
import { VerificationDecision } from '../../domain/verification/verification';

export interface LiveEditorialQueueSource extends EditorialQueueSource {
  readonly canonicalStory: CanonicalStory;
  readonly origin: 'LIVE_NEWS_PIPELINE';
}

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

    const reference = firestore.collection(FIRESTORE_EDITORIAL_ROOT_COLLECTION)
      .doc(story.organizationId)
      .collection(FIRESTORE_EDITORIAL_STORIES_COLLECTION)
      .doc(String(story.id));
    return firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) return false;
      transaction.create(reference, source);
      return true;
    });
  },
});

export const LIVE_EDITORIAL_VERIFICATION_DECISION = VerificationDecision.ALLOW_EDITORIAL_PIPELINE;
