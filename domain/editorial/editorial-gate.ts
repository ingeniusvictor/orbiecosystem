import { RiskLevel } from '../common/enums';
import { EventStatus } from '../events/event';
import { VerificationDecision, type VerificationGateResult } from '../verification/verification';
import type { CanonicalStory } from './canonical-story';
import { EditorialDecision, evaluateCanonicalStory } from './policy';
import { OrbiEditorialBand, editorialBandFromScore } from './scoring';

export enum IntegratedEditorialDecision {
  ALLOW_EDITORIAL = 'ALLOW_EDITORIAL',
  REQUIRE_HUMAN_REVIEW = 'REQUIRE_HUMAN_REVIEW',
  DEFER = 'DEFER',
  BLOCK = 'BLOCK',
}

export interface EditorialGroundingAssessment {
  readonly valid: boolean;
  readonly reasons: readonly string[];
}

export interface IntegratedEditorialGateInput {
  readonly story: CanonicalStory;
  readonly verificationGate: VerificationGateResult;
  readonly eventStatus: EventStatus;
  readonly hasEventContradiction: boolean;
  readonly grounding: EditorialGroundingAssessment;
}

export interface IntegratedEditorialGateResult {
  readonly decision: IntegratedEditorialDecision;
  readonly editorialBand: OrbiEditorialBand;
  readonly reasons: readonly string[];
}

const result = (
  decision: IntegratedEditorialDecision,
  editorialBand: OrbiEditorialBand,
  reasons: readonly string[],
): IntegratedEditorialGateResult => ({
  decision,
  editorialBand,
  reasons: [...new Set(reasons)],
});

export const evaluateIntegratedEditorialGate = (
  input: IntegratedEditorialGateInput,
): IntegratedEditorialGateResult => {
  const editorialBand = editorialBandFromScore(input.story.orbiScore);
  const canonicalPolicy = evaluateCanonicalStory(input.story);

  if (!input.grounding.valid) {
    return result(IntegratedEditorialDecision.BLOCK, editorialBand, [
      'CANONICAL_STORY_GROUNDING_INVALID',
      ...input.grounding.reasons,
    ]);
  }

  if (
    input.verificationGate.decision === VerificationDecision.BLOCK ||
    input.story.riskLevel === RiskLevel.CRITICAL ||
    input.eventStatus === EventStatus.INVALID ||
    canonicalPolicy.decision === EditorialDecision.BLOCK ||
    editorialBand === OrbiEditorialBand.REJECT
  ) {
    const reasons: string[] = ['EDITORIAL_BLOCK_CONDITION_PRESENT'];
    if (input.verificationGate.decision === VerificationDecision.BLOCK) {
      reasons.push('VERIFICATION_GATE_BLOCKED', ...input.verificationGate.reasons);
    }
    if (input.story.riskLevel === RiskLevel.CRITICAL) reasons.push('CRITICAL_RISK');
    if (input.eventStatus === EventStatus.INVALID) reasons.push('EVENT_INVALID');
    if (canonicalPolicy.decision === EditorialDecision.BLOCK) {
      reasons.push('CANONICAL_STORY_POLICY_BLOCKED', ...canonicalPolicy.reasons);
    }
    if (editorialBand === OrbiEditorialBand.REJECT) reasons.push('ORBI_SCORE_REJECTED');
    return result(IntegratedEditorialDecision.BLOCK, editorialBand, reasons);
  }

  if (
    input.verificationGate.decision === VerificationDecision.DEFER ||
    input.eventStatus === EventStatus.DETECTED ||
    input.eventStatus === EventStatus.CONSOLIDATING ||
    editorialBand === OrbiEditorialBand.HOLD
  ) {
    const reasons: string[] = ['EDITORIAL_INPUT_NOT_READY'];
    if (input.verificationGate.decision === VerificationDecision.DEFER) {
      reasons.push('VERIFICATION_GATE_DEFERRED', ...input.verificationGate.reasons);
    }
    if (input.eventStatus === EventStatus.DETECTED || input.eventStatus === EventStatus.CONSOLIDATING) {
      reasons.push('EVENT_NOT_READY_FOR_EDITORIAL');
    }
    if (editorialBand === OrbiEditorialBand.HOLD) reasons.push('ORBI_SCORE_HOLD');
    return result(IntegratedEditorialDecision.DEFER, editorialBand, reasons);
  }

  if (
    input.hasEventContradiction ||
    input.eventStatus === EventStatus.DISPUTED ||
    input.verificationGate.decision === VerificationDecision.REQUIRE_HUMAN_REVIEW ||
    canonicalPolicy.decision === EditorialDecision.REQUIRE_REVIEW
  ) {
    const reasons: string[] = ['HUMAN_EDITORIAL_REVIEW_REQUIRED'];
    if (input.hasEventContradiction) reasons.push('EVENT_CONTRADICTION_PRESENT');
    if (input.eventStatus === EventStatus.DISPUTED) reasons.push('EVENT_DISPUTED');
    if (input.verificationGate.decision === VerificationDecision.REQUIRE_HUMAN_REVIEW) {
      reasons.push('VERIFICATION_REQUIRES_HUMAN_REVIEW', ...input.verificationGate.reasons);
    }
    if (canonicalPolicy.decision === EditorialDecision.REQUIRE_REVIEW) {
      reasons.push('CANONICAL_STORY_REQUIRES_REVIEW', ...canonicalPolicy.reasons);
    }
    return result(IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW, editorialBand, reasons);
  }

  if (input.verificationGate.decision !== VerificationDecision.ALLOW_EDITORIAL_PIPELINE) {
    return result(IntegratedEditorialDecision.DEFER, editorialBand, [
      'VERIFICATION_GATE_NOT_READY_FOR_EDITORIAL',
    ]);
  }

  return result(IntegratedEditorialDecision.ALLOW_EDITORIAL, editorialBand, [
    'EDITORIAL_GATE_REQUIREMENTS_SATISFIED',
  ]);
};
