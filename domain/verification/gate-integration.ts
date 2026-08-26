import { RiskLevel } from '../common/enums';
import { evaluateVerificationGate } from './policy';
import {
  VerificationResearchDecision,
  type ResearchEvidenceDescriptor,
  type VerificationResearchProgress,
} from './research-strategy';
import {
  ClaimSensitivity,
  assessCorroboration,
  getCorroborationRequirement,
  resolvePrimarySource,
} from './source-policy';
import {
  VerificationDecision,
  type VerificationGateResult,
  type VerificationRecord,
} from './verification';

export interface IntegratedVerificationGateInput {
  readonly record: VerificationRecord;
  readonly sensitivity: ClaimSensitivity;
  readonly researchProgress: VerificationResearchProgress;
  readonly researchEvidence: readonly ResearchEvidenceDescriptor[];
}

const result = (
  decision: VerificationDecision,
  reasons: readonly string[],
): VerificationGateResult => ({ decision, reasons });

export const evaluateIntegratedVerificationGate = (
  input: IntegratedVerificationGateInput,
): VerificationGateResult => {
  if (input.record.risk.level === RiskLevel.CRITICAL) {
    return result(VerificationDecision.BLOCK, [
      'CRITICAL_RISK',
      'Critical-risk stories cannot enter the autonomous editorial pipeline.',
    ]);
  }

  if (input.researchProgress.decision === VerificationResearchDecision.STOP_CONTRADICTED) {
    return result(VerificationDecision.REQUIRE_HUMAN_REVIEW, [
      'AUTHORITATIVE_CONTRADICTION_FOUND',
      ...input.researchProgress.reasons,
    ]);
  }

  if (input.researchProgress.decision === VerificationResearchDecision.STOP_BUDGET_EXHAUSTED) {
    return result(VerificationDecision.REQUIRE_HUMAN_REVIEW, [
      'AUTONOMOUS_RESEARCH_BUDGET_EXHAUSTED',
      ...input.researchProgress.reasons,
    ]);
  }

  if (input.researchProgress.decision === VerificationResearchDecision.CONTINUE) {
    return result(VerificationDecision.DEFER, [
      'RESEARCH_NOT_COMPLETE',
      ...input.researchProgress.reasons,
    ]);
  }

  const supportingEvidence = input.researchEvidence.filter(
    (item) => item.stance === 'SUPPORTING',
  );
  const requirement = getCorroborationRequirement({
    sensitivity: input.sensitivity,
    riskLevel: input.record.risk.level,
  });
  const corroboration = assessCorroboration({
    sources: supportingEvidence,
    requirement,
  });

  if (!corroboration.satisfied) {
    return result(VerificationDecision.DEFER, [
      'CORROBORATION_REQUIREMENTS_NOT_SATISFIED',
      ...corroboration.missing,
    ]);
  }

  if (requirement.primarySourceRequired) {
    const primary = resolvePrimarySource(supportingEvidence);
    if (primary.primarySourceId === null) {
      return result(VerificationDecision.DEFER, [
        'ELIGIBLE_PRIMARY_SOURCE_NOT_ESTABLISHED',
      ]);
    }
  }

  const baseGate = evaluateVerificationGate(input.record);
  if (baseGate.decision !== VerificationDecision.ALLOW_EDITORIAL_PIPELINE) {
    return baseGate;
  }

  return result(VerificationDecision.ALLOW_EDITORIAL_PIPELINE, [
    'INTEGRATED_VERIFICATION_GATE_PASSED',
    'Research, corroboration, risk and verification requirements are satisfied.',
  ]);
};
