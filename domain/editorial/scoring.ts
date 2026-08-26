import { RiskLevel, VerificationConfidence } from '../common/enums';

export interface OrbiEditorialScoreDimensions {
  readonly strategicRelevance: number;
  readonly audienceInterest: number;
  readonly practicalValue: number;
  readonly novelty: number;
  readonly timeliness: number;
  readonly evidenceStrength: number;
}

export enum OrbiEditorialBand {
  REJECT = 'REJECT',
  HOLD = 'HOLD',
  PUBLISH = 'PUBLISH',
  PRIORITY = 'PRIORITY',
  BREAKING_CANDIDATE = 'BREAKING_CANDIDATE',
}

export interface OrbiEditorialScore {
  readonly dimensions: OrbiEditorialScoreDimensions;
  readonly total: number;
  readonly band: OrbiEditorialBand;
}

const WEIGHTS: Readonly<Record<keyof OrbiEditorialScoreDimensions, number>> = {
  strategicRelevance: 0.25,
  audienceInterest: 0.2,
  practicalValue: 0.2,
  novelty: 0.15,
  timeliness: 0.1,
  evidenceStrength: 0.1,
};

const assertDimension = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError(`${name} must be between 0 and 100.`);
  }
};

export const editorialBandFromScore = (score: number): OrbiEditorialBand => {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError('ORBI editorial score must be between 0 and 100.');
  }

  if (score < 55) return OrbiEditorialBand.REJECT;
  if (score < 75) return OrbiEditorialBand.HOLD;
  if (score < 85) return OrbiEditorialBand.PUBLISH;
  if (score < 93) return OrbiEditorialBand.PRIORITY;
  return OrbiEditorialBand.BREAKING_CANDIDATE;
};

export const calculateOrbiEditorialScore = (
  dimensions: OrbiEditorialScoreDimensions,
): OrbiEditorialScore => {
  for (const [name, value] of Object.entries(dimensions)) {
    assertDimension(name, value);
  }

  const total = Math.round(
    (Object.keys(WEIGHTS) as (keyof OrbiEditorialScoreDimensions)[]).reduce(
      (sum, key) => sum + dimensions[key] * WEIGHTS[key],
      0,
    ),
  );

  return {
    dimensions,
    total,
    band: editorialBandFromScore(total),
  };
};

export interface BreakingEligibilityInput {
  readonly orbiScore: number;
  readonly socialScore: number | null;
  readonly verificationConfidence: VerificationConfidence;
  readonly riskLevel: RiskLevel;
  readonly verificationAllowed: boolean;
  readonly eventResolved: boolean;
  readonly hasContradiction: boolean;
}

export interface BreakingEligibilityResult {
  readonly eligible: boolean;
  readonly reasons: readonly string[];
}

export const evaluateBreakingEligibility = (
  input: BreakingEligibilityInput,
): BreakingEligibilityResult => {
  if (!Number.isFinite(input.orbiScore) || input.orbiScore < 0 || input.orbiScore > 100) {
    throw new RangeError('ORBI editorial score must be between 0 and 100.');
  }
  if (
    input.socialScore !== null &&
    (!Number.isFinite(input.socialScore) || input.socialScore < 0 || input.socialScore > 100)
  ) {
    throw new RangeError('Social score must be null or between 0 and 100.');
  }

  const reasons: string[] = [];
  if (input.orbiScore < 93) reasons.push('ORBI_SCORE_BELOW_BREAKING_THRESHOLD');
  if (input.socialScore === null || input.socialScore < 90) {
    reasons.push('SOCIAL_SCORE_BELOW_BREAKING_THRESHOLD');
  }
  if (input.verificationConfidence !== VerificationConfidence.VERY_HIGH) {
    reasons.push('VERY_HIGH_VERIFICATION_REQUIRED');
  }
  if (input.riskLevel !== RiskLevel.LOW) reasons.push('LOW_RISK_REQUIRED');
  if (!input.verificationAllowed) reasons.push('VERIFICATION_GATE_NOT_ALLOWED');
  if (!input.eventResolved) reasons.push('EVENT_NOT_RESOLVED');
  if (input.hasContradiction) reasons.push('EVENT_CONTRADICTION_PRESENT');

  return {
    eligible: reasons.length === 0,
    reasons,
  };
};
