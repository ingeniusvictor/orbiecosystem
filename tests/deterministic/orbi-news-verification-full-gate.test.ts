import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RiskLevel,
  RiskReason,
  SourceCredibilityBand,
  SourceRole,
  SourceType,
  VerificationConfidence,
  VerificationStatus,
} from '../../domain/common/enums';
import { evaluateIntegratedVerificationGate } from '../../domain/verification/gate-integration';
import {
  assessVerificationFailure,
  VerificationFailureCode,
  verificationGateFromFailureAssessment,
} from '../../domain/verification/failure-policy';
import {
  VerificationResearchDecision,
  VerificationResearchPhase,
} from '../../domain/verification/research-strategy';
import { ClaimSensitivity } from '../../domain/verification/source-policy';
import {
  VerificationDecision,
  type VerificationRecord,
} from '../../domain/verification/verification';

const now = '2026-08-26T05:35:00.000Z' as never;
const organizationId = 'org-1' as never;
const newsItemId = 'news-1' as never;
const verificationId = 'verification-1' as never;
const primarySourceId = 'primary-1' as never;
const corroboratingSourceId = 'corroborating-1' as never;

const baseRecord = (riskLevel: RiskLevel): VerificationRecord => ({
  id: verificationId,
  organizationId,
  newsItemId,
  eventId: null,
  status: VerificationStatus.VERIFIED,
  confidenceScore: 95,
  confidence: VerificationConfidence.VERY_HIGH,
  claims: [],
  evidence: [],
  risk: {
    level: riskLevel,
    reasons: [],
    notes: [],
  },
  primarySourceId,
  startedAt: now,
  completedAt: now,
  verificationVersion: 'ORBI_VERIFY_V1',
});

const sufficientEvidence = [
  {
    sourceId: primarySourceId,
    sourceType: SourceType.OFFICIAL,
    credibilityBand: SourceCredibilityBand.AUTHORITATIVE,
    role: SourceRole.PRIMARY,
    stance: 'SUPPORTING' as const,
  },
  {
    sourceId: corroboratingSourceId,
    sourceType: SourceType.PRIMARY_MEDIA,
    credibilityBand: SourceCredibilityBand.HIGH,
    role: SourceRole.CORROBORATING,
    stance: 'SUPPORTING' as const,
  },
];

const sufficientResearch = {
  decision: VerificationResearchDecision.STOP_SUFFICIENT,
  nextPhase: null,
  reasons: ['CORROBORATION_REQUIREMENTS_SATISFIED'],
};

test('full gate allows a normal verified story with sufficient evidence', () => {
  const decision = evaluateIntegratedVerificationGate({
    record: baseRecord(RiskLevel.LOW),
    sensitivity: ClaimSensitivity.STANDARD,
    researchProgress: sufficientResearch,
    researchEvidence: sufficientEvidence,
  });

  assert.equal(decision.decision, VerificationDecision.ALLOW_EDITORIAL_PIPELINE);
});

test('financial high-risk claim requires human review even with strong evidence', () => {
  const record: VerificationRecord = {
    ...baseRecord(RiskLevel.HIGH),
    risk: {
      level: RiskLevel.HIGH,
      reasons: [RiskReason.FINANCIAL_CLAIM],
      notes: [],
    },
  };

  const decision = evaluateIntegratedVerificationGate({
    record,
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    researchProgress: sufficientResearch,
    researchEvidence: sufficientEvidence,
  });

  assert.equal(decision.decision, VerificationDecision.REQUIRE_HUMAN_REVIEW);
});

test('political content requires human review even when corroborated', () => {
  const record: VerificationRecord = {
    ...baseRecord(RiskLevel.HIGH),
    risk: {
      level: RiskLevel.HIGH,
      reasons: [RiskReason.POLITICAL_CONTENT],
      notes: [],
    },
  };

  const decision = evaluateIntegratedVerificationGate({
    record,
    sensitivity: ClaimSensitivity.SENSITIVE,
    researchProgress: sufficientResearch,
    researchEvidence: sufficientEvidence,
  });

  assert.equal(decision.decision, VerificationDecision.REQUIRE_HUMAN_REVIEW);
});

for (const reason of [
  RiskReason.MEDICAL_CLAIM,
  RiskReason.PRIVACY_CONCERN,
  RiskReason.MANIPULATED_MEDIA,
]) {
  test(`critical ${reason} blocks autonomous editorial entry`, () => {
    const record: VerificationRecord = {
      ...baseRecord(RiskLevel.CRITICAL),
      risk: {
        level: RiskLevel.CRITICAL,
        reasons: [reason],
        notes: [],
      },
    };

    const decision = evaluateIntegratedVerificationGate({
      record,
      sensitivity: ClaimSensitivity.SENSITIVE,
      researchProgress: sufficientResearch,
      researchEvidence: sufficientEvidence,
    });

    assert.equal(decision.decision, VerificationDecision.BLOCK);
  });
}

test('authoritative contradiction forces human review', () => {
  const decision = evaluateIntegratedVerificationGate({
    record: baseRecord(RiskLevel.MEDIUM),
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    researchProgress: {
      decision: VerificationResearchDecision.STOP_CONTRADICTED,
      nextPhase: null,
      reasons: ['AUTHORITATIVE_CONTRADICTION_FOUND'],
    },
    researchEvidence: [
      ...sufficientEvidence,
      {
        sourceId: 'official-denial' as never,
        sourceType: SourceType.OFFICIAL,
        credibilityBand: SourceCredibilityBand.AUTHORITATIVE,
        role: SourceRole.CONTRADICTING,
        stance: 'CONTRADICTING' as const,
      },
    ],
  });

  assert.equal(decision.decision, VerificationDecision.REQUIRE_HUMAN_REVIEW);
});

test('incomplete research defers even if record currently says verified', () => {
  const decision = evaluateIntegratedVerificationGate({
    record: baseRecord(RiskLevel.LOW),
    sensitivity: ClaimSensitivity.STANDARD,
    researchProgress: {
      decision: VerificationResearchDecision.CONTINUE,
      nextPhase: VerificationResearchPhase.CORROBORATION,
      reasons: ['INSUFFICIENT_INDEPENDENT_SUPPORTING_SOURCES'],
    },
    researchEvidence: [sufficientEvidence[0]],
  });

  assert.equal(decision.decision, VerificationDecision.DEFER);
});

test('total timeout after retries defers and never becomes allow', () => {
  const assessment = assessVerificationFailure({
    failure: {
      code: VerificationFailureCode.TIMEOUT,
      providerId: 'research-provider',
      message: 'Timed out',
      retryable: true,
    },
    attempt: 3,
    policy: { maxAttempts: 3, timeoutMs: 10_000 },
    hasUsableEvidence: false,
  });

  const decision = verificationGateFromFailureAssessment(assessment);
  assert.equal(decision.decision, VerificationDecision.DEFER);
  assert.notEqual(decision.decision, VerificationDecision.ALLOW_EDITORIAL_PIPELINE);
});

test('partial provider failure with usable evidence requires human review', () => {
  const assessment = assessVerificationFailure({
    failure: {
      code: VerificationFailureCode.PARTIAL_FAILURE,
      providerId: 'research-provider',
      message: 'One source failed while others succeeded',
      retryable: false,
    },
    attempt: 1,
    policy: { maxAttempts: 3, timeoutMs: 10_000 },
    hasUsableEvidence: true,
  });

  const decision = verificationGateFromFailureAssessment(assessment);
  assert.equal(decision.decision, VerificationDecision.REQUIRE_HUMAN_REVIEW);
});
