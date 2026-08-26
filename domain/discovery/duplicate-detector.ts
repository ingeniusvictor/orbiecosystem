import type { NormalizedDiscoveryCandidate } from './normalization';

export interface ExactDuplicateMatch {
  readonly duplicate: boolean;
  readonly canonicalUrlKey: string;
  readonly matchedAgainstKey: string | null;
}

export const detectExactDuplicate = (
  candidate: NormalizedDiscoveryCandidate,
  existingCanonicalUrlKeys: ReadonlySet<string>,
): ExactDuplicateMatch => {
  const duplicate = existingCanonicalUrlKeys.has(candidate.canonicalUrlKey);
  return {
    duplicate,
    canonicalUrlKey: candidate.canonicalUrlKey,
    matchedAgainstKey: duplicate ? candidate.canonicalUrlKey : null,
  };
};

export const deduplicateDiscoveryBatch = (
  candidates: readonly NormalizedDiscoveryCandidate[],
): {
  readonly unique: readonly NormalizedDiscoveryCandidate[];
  readonly duplicates: readonly NormalizedDiscoveryCandidate[];
} => {
  const seen = new Set<string>();
  const unique: NormalizedDiscoveryCandidate[] = [];
  const duplicates: NormalizedDiscoveryCandidate[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.canonicalUrlKey)) {
      duplicates.push(candidate);
      continue;
    }
    seen.add(candidate.canonicalUrlKey);
    unique.push(candidate);
  }

  return { unique, duplicates };
};
