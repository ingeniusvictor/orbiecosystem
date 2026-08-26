import type { EventId, NewsItemId } from '../common/types';
import {
  EventResolutionOutcome,
  type EventFingerprint,
  type EventResolutionCandidate,
} from './event';

export interface EventMatchCandidate {
  readonly eventId: EventId;
  readonly fingerprint: EventFingerprint;
  readonly materialUpdateSignals?: readonly string[];
}

const equality = (a: string | null, b: string | null): number => {
  if (a === null && b === null) return 1;
  if (a === null || b === null) return 0;
  return a === b ? 1 : 0;
};

const overlapRatio = (a: readonly string[], b: readonly string[]): number => {
  if (a.length === 0 && b.length === 0) return 1;
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 1;
  const bSet = new Set(b);
  const intersection = new Set(a.filter((value) => bSet.has(value)));
  return intersection.size / union.size;
};

export const calculateEventSimilarityScore = (
  incoming: EventFingerprint,
  existing: EventFingerprint,
): number => {
  const entity = equality(incoming.primaryEntity, existing.primaryEntity) * 35;
  const type = incoming.eventType === existing.eventType ? 25 : 0;
  const subject = equality(incoming.subject, existing.subject) * 15;
  const date = equality(incoming.dateBucket, existing.dateBucket) * 10;
  const location = equality(incoming.location, existing.location) * 5;
  const secondary = overlapRatio(incoming.secondaryEntities, existing.secondaryEntities) * 10;

  return Math.round(entity + type + subject + date + location + secondary);
};

const outcomeForScore = (input: {
  readonly score: number;
  readonly materialUpdateSignals: readonly string[];
  readonly sameHash: boolean;
}): EventResolutionOutcome => {
  if (input.sameHash) {
    return input.materialUpdateSignals.length > 0
      ? EventResolutionOutcome.MATERIAL_UPDATE
      : EventResolutionOutcome.SAME_EVENT;
  }

  if (input.score >= 85) {
    return input.materialUpdateSignals.length > 0
      ? EventResolutionOutcome.MATERIAL_UPDATE
      : EventResolutionOutcome.SAME_EVENT;
  }
  if (input.score >= 60) return EventResolutionOutcome.RELATED_EVENT;
  if (input.score >= 40) return EventResolutionOutcome.UNRESOLVED;
  return EventResolutionOutcome.NEW_EVENT;
};

export const resolveEventCandidate = (input: {
  readonly incomingNewsItemId: NewsItemId;
  readonly incomingFingerprint: EventFingerprint;
  readonly candidates: readonly EventMatchCandidate[];
}): EventResolutionCandidate => {
  if (input.candidates.length === 0) {
    return {
      incomingNewsItemId: input.incomingNewsItemId,
      candidateEventId: null,
      similarityScore: 0,
      proposedOutcome: EventResolutionOutcome.NEW_EVENT,
      reason: 'NO_EVENT_CANDIDATES',
    };
  }

  const ranked = input.candidates
    .map((candidate) => ({
      candidate,
      score: calculateEventSimilarityScore(input.incomingFingerprint, candidate.fingerprint),
      sameHash: input.incomingFingerprint.fingerprintHash === candidate.fingerprint.fingerprintHash,
    }))
    .sort((a, b) => b.score - a.score || String(a.candidate.eventId).localeCompare(String(b.candidate.eventId)));

  const best = ranked[0]!;
  const materialUpdateSignals = best.candidate.materialUpdateSignals ?? [];
  const proposedOutcome = outcomeForScore({
    score: best.score,
    materialUpdateSignals,
    sameHash: best.sameHash,
  });

  return {
    incomingNewsItemId: input.incomingNewsItemId,
    candidateEventId: proposedOutcome === EventResolutionOutcome.NEW_EVENT ? null : best.candidate.eventId,
    similarityScore: best.score,
    proposedOutcome,
    reason: best.sameHash
      ? materialUpdateSignals.length > 0
        ? 'EXACT_FINGERPRINT_WITH_MATERIAL_UPDATE_SIGNAL'
        : 'EXACT_EVENT_FINGERPRINT'
      : materialUpdateSignals.length > 0 && best.score >= 85
        ? 'HIGH_SIMILARITY_WITH_MATERIAL_UPDATE_SIGNAL'
        : `EVENT_SIMILARITY_${best.score}`,
  };
};
