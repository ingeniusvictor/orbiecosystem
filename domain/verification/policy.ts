import {
  RiskLevel,
  VerificationConfidence,
  VerificationStatus,
} from '../common/enums';
import type { VerificationRecord } from './verification';
import {
  VerificationDecision,
  type VerificationGateResult,
} from './verification';

export const verificationConfidenceFromScore = (
  score: number,
): VerificationConfidence => {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError('Verification confidence score must be between 0 and 100.');
  }

  if (score <= 24) return VerificationConfidence.VERY_LOW;
  if (score <= 49) return VerificationConfidence.LOW;
  if (score <= 69) return VerificationConfidence.MODERATE;
  if (score <= 89) return VerificationConfidence.HIGH;
  return VerificationConfidence.VERY_HIGH;
};

export const evaluateVerificationGate = (
  record: VerificationRecord,
): VerificationGateResult => {
  const reasons: string[] = [];

  if (record.risk.level === RiskLevel.CRITICAL) {
    return {
      decision: VerificationDecision.BLOCK,
      reasons: ['Critical-risk stories cannot enter the autonomous editorial pipeline.'],
    };
  }

  if (record.status === VerificationStatus.CONTRADICTED) {
    return {
      decision: VerificationDecision.REQUIRE_HUMAN_REVIEW,
      reasons: ['Material source contradiction requires human review.'],
    };
  }

  if (
    record.status === VerificationStatus.UNVERIFIED ||
    record.status === VerificationStatus.FAILED ||
    record.status === VerificationStatus.NOT_STARTED ||
    record.status === VerificationStatus.IN_PROGRESS
  ) {
    return {
      decision: VerificationDecision.DEFER,
      reasons: ['Verification is not complete enough for editorial publication.'],
    };
  }

  if (record.risk.level === RiskLevel.HIGH) {
    reasons.push('High-risk stories require human review.');
  }

  if (record.status === VerificationStatus.PARTIALLY_VERIFIED) {
    reasons.push('Partially verified stories require human review.');
  }

  if (
    record.confidence === VerificationConfidence.VERY_LOW ||
    record.confidence === VerificationConfidence.LOW ||
    record.confidence === VerificationConfidence.MODERATE
  ) {
    reasons.push('Verification confidence is below HIGH.');
  }

  if (record.primarySourceId === null) {
    reasons.push('No primary source has been established.');
  }

  if (reasons.length > 0) {
    return {
      decision: VerificationDecision.REQUIRE_HUMAN_REVIEW,
      reasons,
    };
  }

  return {
    decision: VerificationDecision.ALLOW_EDITORIAL_PIPELINE,
    reasons: ['Verification gate passed.'],
  };
};
