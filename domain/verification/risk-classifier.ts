import { RiskLevel, RiskReason } from '../common/enums';

export interface RiskSignal {
  readonly reason: RiskReason;
  readonly note?: string | null;
}

export interface RiskClassification {
  readonly level: RiskLevel;
  readonly reasons: readonly RiskReason[];
  readonly notes: readonly string[];
}

const RISK_WEIGHTS: Readonly<Record<RiskReason, number>> = {
  [RiskReason.RUMOR]: 2,
  [RiskReason.UNVERIFIED_CLAIM]: 2,
  [RiskReason.LEGAL_SENSITIVITY]: 3,
  [RiskReason.REPUTATIONAL_RISK]: 3,
  [RiskReason.FINANCIAL_CLAIM]: 3,
  [RiskReason.SECURITY_INCIDENT]: 3,
  [RiskReason.PRIVACY_CONCERN]: 4,
  [RiskReason.POLITICAL_CONTENT]: 3,
  [RiskReason.MEDICAL_CLAIM]: 4,
  [RiskReason.MANIPULATED_MEDIA]: 4,
  [RiskReason.SOURCE_CONFLICT]: 3,
  [RiskReason.COPYRIGHT_RISK]: 2,
  [RiskReason.OTHER]: 1,
};

const levelFromWeight = (weight: number): RiskLevel => {
  if (weight >= 4) return RiskLevel.CRITICAL;
  if (weight >= 3) return RiskLevel.HIGH;
  if (weight >= 2) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
};

export const classifyVerificationRisk = (
  signals: readonly RiskSignal[],
): RiskClassification => {
  const uniqueReasons = [...new Set(signals.map((signal) => signal.reason))];
  const highestWeight = uniqueReasons.reduce(
    (max, reason) => Math.max(max, RISK_WEIGHTS[reason]),
    0,
  );

  const notes = [...new Set(
    signals
      .map((signal) => signal.note?.trim())
      .filter((note): note is string => Boolean(note)),
  )];

  return {
    level: levelFromWeight(highestWeight),
    reasons: uniqueReasons,
    notes,
  };
};

export const mergeRiskClassifications = (
  ...classifications: readonly RiskClassification[]
): RiskClassification => {
  const levelRank: Readonly<Record<RiskLevel, number>> = {
    [RiskLevel.LOW]: 1,
    [RiskLevel.MEDIUM]: 2,
    [RiskLevel.HIGH]: 3,
    [RiskLevel.CRITICAL]: 4,
  };

  const highest = classifications.reduce<RiskLevel>(
    (current, item) => levelRank[item.level] > levelRank[current] ? item.level : current,
    RiskLevel.LOW,
  );

  return {
    level: highest,
    reasons: [...new Set(classifications.flatMap((item) => item.reasons))],
    notes: [...new Set(classifications.flatMap((item) => item.notes))],
  };
};
