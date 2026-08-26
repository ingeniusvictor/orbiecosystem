import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RiskLevel,
  SourceCredibilityBand,
  SourceRole,
  SourceType,
} from '../../domain/common/enums';
import {
  ClaimSensitivity,
} from '../../domain/verification/source-policy';
import {
  VerificationResearchDecision,
  VerificationResearchPhase,
  buildVerificationResearchPlan,
  evaluateVerificationResearchProgress,
} from '../../domain/verification/research-strategy';

const primary = {
  sourceId: 'primary' as never,
  sourceType: SourceType.OFFICIAL,
  credibilityBand: SourceCredibilityBand.AUTHORITATIVE,
  role: SourceRole.PRIMARY,
  stance: 'SUPPORTING' as const,
};

const corroborating = {
  sourceId: 'media' as never,
  sourceType: SourceType.PRIMARY_MEDIA,
  credibilityBand: SourceCredibilityBand.HIGH,
  role: SourceRole.CORROBORATING,
  stance: 'SUPPORTING' as const,
};

test('standard low-risk plan prioritizes primary then corroboration and keeps bounded budget', () => {
  const plan = buildVerificationResearchPlan({
    sensitivity: ClaimSensitivity.STANDARD,
    riskLevel: RiskLevel.LOW,
  });

  assert.deepEqual(
    plan.steps.map((step) => step.phase),
    [
      VerificationResearchPhase.PRIMARY_SOURCE,
      VerificationResearchPhase.CORROBORATION,
      VerificationResearchPhase.CONTRADICTION_CHECK,
      VerificationResearchPhase.CONTEXT,
    ],
  );
  assert.equal(plan.maxTotalSources, 4);
});

test('high-impact plan requires primary and contradiction-check phases', () => {
  const plan = buildVerificationResearchPlan({
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    riskLevel: RiskLevel.MEDIUM,
  });

  assert.equal(
    plan.steps.find((step) => step.phase === VerificationResearchPhase.PRIMARY_SOURCE)?.required,
    true,
  );
  assert.equal(
    plan.steps.find((step) => step.phase === VerificationResearchPhase.CONTRADICTION_CHECK)?.required,
    true,
  );
  assert.equal(plan.maxTotalSources, 6);
});

test('high-impact research requests primary source before corroboration when absent', () => {
  const plan = buildVerificationResearchPlan({
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    riskLevel: RiskLevel.MEDIUM,
  });

  const progress = evaluateVerificationResearchProgress({
    plan,
    evidence: [corroborating],
    contradictionSearchCompleted: false,
  });

  assert.equal(progress.decision, VerificationResearchDecision.CONTINUE);
  assert.equal(progress.nextPhase, VerificationResearchPhase.PRIMARY_SOURCE);
});

test('high-impact research continues to contradiction check after corroboration is satisfied', () => {
  const plan = buildVerificationResearchPlan({
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    riskLevel: RiskLevel.MEDIUM,
  });

  const progress = evaluateVerificationResearchProgress({
    plan,
    evidence: [primary, corroborating],
    contradictionSearchCompleted: false,
  });

  assert.equal(progress.decision, VerificationResearchDecision.CONTINUE);
  assert.equal(progress.nextPhase, VerificationResearchPhase.CONTRADICTION_CHECK);
});

test('research stops sufficient once corroboration and required contradiction check are complete', () => {
  const plan = buildVerificationResearchPlan({
    sensitivity: ClaimSensitivity.HIGH_IMPACT,
    riskLevel: RiskLevel.MEDIUM,
  });

  const progress = evaluateVerificationResearchProgress({
    plan,
    evidence: [primary, corroborating],
    contradictionSearchCompleted: true,
  });

  assert.equal(progress.decision, VerificationResearchDecision.STOP_SUFFICIENT);
});

test('authoritative contradiction stops research immediately', () => {
  const plan = buildVerificationResearchPlan({
    sensitivity: ClaimSensitivity.SENSITIVE,
    riskLevel: RiskLevel.HIGH,
  });

  const progress = evaluateVerificationResearchProgress({
    plan,
    evidence: [
      primary,
      {
        sourceId: 'official-denial' as never,
        sourceType: SourceType.GOVERNMENT,
        credibilityBand: SourceCredibilityBand.AUTHORITATIVE,
        role: SourceRole.CONTRADICTING,
        stance: 'CONTRADICTING',
      },
    ],
    contradictionSearchCompleted: false,
  });

  assert.equal(progress.decision, VerificationResearchDecision.STOP_CONTRADICTED);
});

test('research budget is finite and stops when exhausted', () => {
  const plan = buildVerificationResearchPlan({
    sensitivity: ClaimSensitivity.STANDARD,
    riskLevel: RiskLevel.LOW,
  });

  const evidence = Array.from({ length: plan.maxTotalSources }, (_, index) => ({
    sourceId: `source-${index}` as never,
    sourceType: SourceType.SECONDARY_MEDIA,
    credibilityBand: SourceCredibilityBand.MODERATE,
    role: SourceRole.CONTEXT,
    stance: 'NEUTRAL' as const,
  }));

  const progress = evaluateVerificationResearchProgress({
    plan,
    evidence,
    contradictionSearchCompleted: false,
  });

  assert.equal(progress.decision, VerificationResearchDecision.STOP_BUDGET_EXHAUSTED);
});
