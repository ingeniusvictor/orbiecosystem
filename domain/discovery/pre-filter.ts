import { SourceCredibilityBand } from '../common/enums';
import type { IsoUtcDateTime } from '../common/types';
import type { NormalizedDiscoveryCandidate } from './normalization';

export enum DiscoveryPriorityBand {
  REJECT = 'REJECT',
  LOW = 'LOW',
  INVESTIGATE = 'INVESTIGATE',
  HIGH = 'HIGH',
}

export interface DiscoveryPreFilterInput {
  readonly candidate: NormalizedDiscoveryCandidate;
  readonly sourceCredibility: SourceCredibilityBand;
  readonly now: IsoUtcDateTime;
  readonly matchedOrbiKeywords: readonly string[];
  readonly matchedPriorityKeywords: readonly string[];
}

export interface DiscoveryPreFilterScore {
  readonly recency: number;
  readonly sourceQuality: number;
  readonly orbiRelevance: number;
  readonly prioritySignal: number;
  readonly total: number;
  readonly band: DiscoveryPriorityBand;
  readonly reasons: readonly string[];
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const sourceQualityScore = (band: SourceCredibilityBand): number => {
  switch (band) {
    case SourceCredibilityBand.AUTHORITATIVE:
      return 25;
    case SourceCredibilityBand.HIGH:
      return 22;
    case SourceCredibilityBand.MODERATE:
      return 15;
    case SourceCredibilityBand.LOW:
      return 6;
    case SourceCredibilityBand.UNKNOWN:
      return 10;
  }
};

const recencyScore = (
  publishedAt: IsoUtcDateTime | null,
  discoveredAt: IsoUtcDateTime,
  now: IsoUtcDateTime,
): number => {
  const reference = publishedAt ?? discoveredAt;
  const ageMs = Date.parse(now) - Date.parse(reference);
  if (!Number.isFinite(ageMs)) return 0;
  const ageHours = Math.max(0, ageMs / 3_600_000);

  if (ageHours <= 6) return 30;
  if (ageHours <= 24) return 27;
  if (ageHours <= 72) return 22;
  if (ageHours <= 168) return 16;
  if (ageHours <= 720) return 8;
  return 0;
};

const relevanceScore = (matches: readonly string[]): number =>
  clamp(new Set(matches.map((value) => value.trim().toLowerCase()).filter(Boolean)).size * 7, 0, 30);

const prioritySignalScore = (matches: readonly string[]): number =>
  clamp(new Set(matches.map((value) => value.trim().toLowerCase()).filter(Boolean)).size * 5, 0, 15);

export const discoveryPriorityBandFromScore = (score: number): DiscoveryPriorityBand => {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError('Discovery pre-filter score must be between 0 and 100.');
  }

  if (score < 35) return DiscoveryPriorityBand.REJECT;
  if (score < 55) return DiscoveryPriorityBand.LOW;
  if (score < 75) return DiscoveryPriorityBand.INVESTIGATE;
  return DiscoveryPriorityBand.HIGH;
};

export const evaluateDiscoveryPreFilter = (
  input: DiscoveryPreFilterInput,
): DiscoveryPreFilterScore => {
  const recency = recencyScore(
    input.candidate.publishedAt,
    input.candidate.discoveredAt,
    input.now,
  );
  const sourceQuality = sourceQualityScore(input.sourceCredibility);
  const orbiRelevance = relevanceScore(input.matchedOrbiKeywords);
  const prioritySignal = prioritySignalScore(input.matchedPriorityKeywords);
  const total = clamp(recency + sourceQuality + orbiRelevance + prioritySignal, 0, 100);
  const reasons: string[] = [];

  if (recency === 0) reasons.push('CONTENT_IS_STALE');
  if (sourceQuality <= 6) reasons.push('LOW_SOURCE_QUALITY');
  if (orbiRelevance === 0) reasons.push('NO_ORBI_RELEVANCE_SIGNAL');
  if (prioritySignal === 0) reasons.push('NO_PRIORITY_SIGNAL');

  return {
    recency,
    sourceQuality,
    orbiRelevance,
    prioritySignal,
    total,
    band: discoveryPriorityBandFromScore(total),
    reasons,
  };
};

export const shouldInvestigateDiscoveryCandidate = (
  score: DiscoveryPreFilterScore,
): boolean =>
  score.band === DiscoveryPriorityBand.INVESTIGATE ||
  score.band === DiscoveryPriorityBand.HIGH;
