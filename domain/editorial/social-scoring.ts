export interface SocialScoreDimensions {
  readonly audienceInterest: number;
  readonly visualPotential: number;
  readonly conversationPotential: number;
  readonly practicalValue: number;
  readonly novelty: number;
  readonly brandFit: number;
}

export enum SocialScoreBand {
  REJECT = 'REJECT',
  HOLD = 'HOLD',
  CANDIDATE = 'CANDIDATE',
  PRIORITY = 'PRIORITY',
}

export interface SocialScore {
  readonly dimensions: SocialScoreDimensions;
  readonly total: number;
  readonly band: SocialScoreBand;
}

export const SOCIAL_SCORE_CANDIDATE_THRESHOLD = 80;
export const SOCIAL_SCORE_PRIORITY_THRESHOLD = 90;

export const SOCIAL_SCORE_WEIGHTS: Readonly<Record<keyof SocialScoreDimensions, number>> = {
  audienceInterest: 0.25,
  visualPotential: 0.15,
  conversationPotential: 0.15,
  practicalValue: 0.20,
  novelty: 0.10,
  brandFit: 0.15,
};

const assertDimension = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${name} must be between 0 and 100.`);
  }
};

export const socialBandFromScore = (score: number): SocialScoreBand => {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError('Social score must be between 0 and 100.');
  }

  if (score < 60) return SocialScoreBand.REJECT;
  if (score < SOCIAL_SCORE_CANDIDATE_THRESHOLD) return SocialScoreBand.HOLD;
  if (score < SOCIAL_SCORE_PRIORITY_THRESHOLD) return SocialScoreBand.CANDIDATE;
  return SocialScoreBand.PRIORITY;
};

export const calculateSocialScore = (
  dimensions: SocialScoreDimensions,
): SocialScore => {
  for (const [name, value] of Object.entries(dimensions)) {
    assertDimension(name, value);
  }

  const total = Math.round(
    (Object.keys(SOCIAL_SCORE_WEIGHTS) as (keyof SocialScoreDimensions)[]).reduce(
      (sum, key) => sum + dimensions[key] * SOCIAL_SCORE_WEIGHTS[key],
      0,
    ),
  );

  return {
    dimensions,
    total,
    band: socialBandFromScore(total),
  };
};

export const isSocialDistributionCandidate = (score: number): boolean =>
  socialBandFromScore(score) === SocialScoreBand.CANDIDATE ||
  socialBandFromScore(score) === SocialScoreBand.PRIORITY;

export const isSocialPriorityCandidate = (score: number): boolean =>
  socialBandFromScore(score) === SocialScoreBand.PRIORITY;
