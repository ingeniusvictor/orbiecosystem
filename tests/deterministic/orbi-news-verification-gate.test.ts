import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RiskLevel,
  SourceCredibilityBand,
  SourceRole,
  SourceType,
  VerificationConfidence,
  VerificationStatus,
} from '../../domain/common/enums';
import { ClaimSensitivity } from '../../domain/verification/source-policy';
import {
  VerificationResearchDecision,
} from '../../domain/verification/research-strategy';
import {
  evaluateIntegratedVerificationGate,
} from '../../domain/verification/gate-integration';
import { VerificationDecision } from '../../domain/verification/verification';

const now = '2026-08-26T05:30:00.000Z' as never;
const primarySourceId = 'source-primary' as never;
const corroboratingSourceId = 'source-corroborating' as never;

const baseRecord = {
  id: 'verification-1' as never,
  organizationId: 'org-1' as never,
  newsItemId: 'news-1' as never,
  eventId: null,
  status: VerificationStatus.VERIFIED,
  confidenceScore: 95,
  confidence: VerificationConfidence.VERY_HIGH,
  claims: [],
  evidence: [],
  risk: { level: RiskLevel.LOW, reasons: [], notes: [] },
  primarySourceId,
  startedAt: now,
  completedAt: now,
  verificationVersion: 'ORBI_VERIFY_V1',
};

const researchEvidence = [
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

test('integrated gate allows fully verified low-risk research', () => {
  const result = evaluateIntegratedVerificationGate({
    record: baseRecord,
    sensitivity: ClaimSensitivity.STANDARD,
    researchEvidence,
    researchProgress: {
      decision: VerificationResearchDecision.STOP_SUFFICIENT,
      nextPhase: null,
      reasons: ['CORROBORATION_REQUIREMENTS_SATISFIED'],
    },
  });

  assert.equal(result.decision, VerificationDecision.ALLOW_EDITORIAL_PIPELINE);
});

test('integrated gate defers while research is incomplete', () => {
  const result = evaluateIntegratedVerificationGate({
    record: baseRecord,
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    researchEvidence: researchEvidence.slice(0, 1),
    researchProgress: {
      decision: VerificationResearchDecision.CONTINUE,
      nextPhase: null,
      reasons: ['INSUFFICIENT_INDEPENDENT_SUPPORTING_SOURCES'],
    },
  });

  assert.equal(result.decision, VerificationDecision.DEFER);
  assert.ok(result.reasons.includes('RESEARCH_NOT_COMPLETE'));
});

test('integrated gate sends exhausted autonomous research to human review', () => {
  const result = evaluateIntegratedVerificationGate({
    record: baseRecord,
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    researchEvidence: researchEvidence.slice(0, 1),
    researchProgress: {
      decision: VerificationResearchDecision.STOP_BUDGET_EXHAUSTED,
      nextPhase: null,
      reasons: ['RESEARCH_SOURCE_BUDGET_EXHAUSTED'],
    },
  });

  assert.equal(result.decision, VerificationDecision.REQUIRE_HUMAN_REVIEW);
  assert.ok(result.reasons.includes('AUTONOMOUS_RESEARCH_BUDGET_EXHAUSTED'));
});

test('integrated gate requires human review for authoritative contradiction', () => {
  const result = evaluateIntegratedVerificationGate({
    record: {
      ...baseRecord,
      status: VerificationStatus.CONTRADICTED,
      risk: { level: RiskLevel.HIGH, reasons: [], notes: [] },
    },
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    researchEvidence,
    researchProgress: {
      decision: VerificationResearchDecision.STOP_CONTRADICTED,
      nextPhase: null,
      reasons: ['AUTHORITATIVE_CONTRADICTION_FOUND'],
    },
  });

  assert.equal(result.decision, VerificationDecision.REQUIRE_HUMAN_REVIEW);
});

test('integrated gate blocks critical-risk content regardless of research sufficiency', () => {
  const result = evaluateIntegratedVerificationGate({
    record: {
      ...baseRecord,
      risk: { level: RiskLevel.CRITICAL, reasons: [], notes: [] },
    },
    sensitivity: ClaimSensitivity.SENSITIVE,
    researchEvidence,
    researchProgress: {
      decision: VerificationResearchDecision.STOP_SUFFICIENT,
      nextPhase: null,
      reasons: ['CORROBORATION_REQUIREMENTS_SATISFIED'],
    },
  });

  assert.equal(result.decision, VerificationDecision.BLOCK);
});

test('integrated gate does not allow insufficient high-impact corroboration', () => {
  const result = evaluateIntegratedVerificationGate({
    record: baseRecord,
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    researchEvidence: researchEvidence.slice(0, 1),
    researchProgress: {
      decision: VerificationResearchDecision.STOP_SUFFICIENT,
      nextPhase: null,
      reasons: [],
    },
  });

  assert.equal(result.decision, VerificationDecision.DEFER);
  assert.ok(result.reasons.includes('CORROBORATION_REQUIREMENTS_NOT_SATISFIED'));
});
