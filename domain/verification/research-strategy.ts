import {
  RiskLevel,
  SourceCredibilityBand,
  SourceRole,
  SourceType,
} from '../common/enums';
import type { SourceId } from '../common/types';
import {
  ClaimSensitivity,
  assessCorroboration,
  getCorroborationRequirement,
  type VerificationSourceDescriptor,
} from './source-policy';

export enum VerificationResearchPhase {
  PRIMARY_SOURCE = 'PRIMARY_SOURCE',
  CORROBORATION = 'CORROBORATION',
  CONTRADICTION_CHECK = 'CONTRADICTION_CHECK',
  CONTEXT = 'CONTEXT',
}

export interface VerificationResearchStep {
  readonly phase: VerificationResearchPhase;
  readonly required: boolean;
  readonly maxSources: number;
  readonly preferredSourceTypes: readonly SourceType[];
  readonly minimumCredibilityBand: SourceCredibilityBand;
}

export interface VerificationResearchPlan {
  readonly sensitivity: ClaimSensitivity;
  readonly riskLevel: RiskLevel;
  readonly steps: readonly VerificationResearchStep[];
  readonly maxTotalSources: number;
}

export enum VerificationResearchDecision {
  CONTINUE = 'CONTINUE',
  STOP_SUFFICIENT = 'STOP_SUFFICIENT',
  STOP_CONTRADICTED = 'STOP_CONTRADICTED',
  STOP_BUDGET_EXHAUSTED = 'STOP_BUDGET_EXHAUSTED',
}

export interface ResearchEvidenceDescriptor extends VerificationSourceDescriptor {
  readonly stance: 'SUPPORTING' | 'CONTRADICTING' | 'NEUTRAL';
}

export interface VerificationResearchProgress {
  readonly decision: VerificationResearchDecision;
  readonly nextPhase: VerificationResearchPhase | null;
  readonly reasons: readonly string[];
}

const PRIMARY_TYPES: readonly SourceType[] = [
  SourceType.OFFICIAL,
  SourceType.GOVERNMENT,
  SourceType.ACADEMIC,
  SourceType.PRESS_RELEASE,
  SourceType.COMPANY_BLOG,
  SourceType.SOCIAL_OFFICIAL,
];

const CORROBORATION_TYPES: readonly SourceType[] = [
  SourceType.PRIMARY_MEDIA,
  SourceType.SECONDARY_MEDIA,
  SourceType.ACADEMIC,
  SourceType.GOVERNMENT,
];

export const buildVerificationResearchPlan = (input: {
  readonly sensitivity: ClaimSensitivity;
  readonly riskLevel: RiskLevel;
}): VerificationResearchPlan => {
  const elevated = input.riskLevel === RiskLevel.HIGH || input.riskLevel === RiskLevel.CRITICAL;
  const sensitive = input.sensitivity === ClaimSensitivity.SENSITIVE;
  const highImpact = input.sensitivity === ClaimSensitivity.HIGH_IMPACT;

  const primaryRequired = elevated || sensitive || highImpact;
  const contradictionRequired = elevated || sensitive || highImpact;

  return {
    sensitivity: input.sensitivity,
    riskLevel: input.riskLevel,
    maxTotalSources: sensitive || input.riskLevel === RiskLevel.CRITICAL ? 8 : elevated || highImpact ? 6 : 4,
    steps: [
      {
        phase: VerificationResearchPhase.PRIMARY_SOURCE,
        required: primaryRequired,
        maxSources: primaryRequired ? 2 : 1,
        preferredSourceTypes: PRIMARY_TYPES,
        minimumCredibilityBand: SourceCredibilityBand.HIGH,
      },
      {
        phase: VerificationResearchPhase.CORROBORATION,
        required: true,
        maxSources: sensitive || elevated || highImpact ? 3 : 2,
        preferredSourceTypes: CORROBORATION_TYPES,
        minimumCredibilityBand: SourceCredibilityBand.MODERATE,
      },
      {
        phase: VerificationResearchPhase.CONTRADICTION_CHECK,
        required: contradictionRequired,
        maxSources: contradictionRequired ? 2 : 1,
        preferredSourceTypes: [...PRIMARY_TYPES, SourceType.PRIMARY_MEDIA],
        minimumCredibilityBand: SourceCredibilityBand.HIGH,
      },
      {
        phase: VerificationResearchPhase.CONTEXT,
        required: false,
        maxSources: 1,
        preferredSourceTypes: [SourceType.PRIMARY_MEDIA, SourceType.SECONDARY_MEDIA, SourceType.ACADEMIC],
        minimumCredibilityBand: SourceCredibilityBand.MODERATE,
      },
    ],
  };
};

const uniqueEvidence = (
  evidence: readonly ResearchEvidenceDescriptor[],
): readonly ResearchEvidenceDescriptor[] =>
  [...new Map(evidence.map((item) => [item.sourceId, item])).values()];

const nextRequiredPhase = (
  plan: VerificationResearchPlan,
  evidence: readonly ResearchEvidenceDescriptor[],
): VerificationResearchPhase | null => {
  const unique = uniqueEvidence(evidence);
  const hasEligiblePrimary = assessCorroboration({
    sources: unique,
    requirement: {
      minimumIndependentSupportingSources: 0,
      primarySourceRequired: true,
      authoritativeSourceRequired: false,
    },
  }).satisfied;

  if (
    plan.steps.find((step) => step.phase === VerificationResearchPhase.PRIMARY_SOURCE)?.required &&
    !hasEligiblePrimary
  ) {
    return VerificationResearchPhase.PRIMARY_SOURCE;
  }

  const supportingCount = new Set(
    unique
      .filter((item) => item.stance === 'SUPPORTING')
      .filter((item) => item.role === SourceRole.PRIMARY || item.role === SourceRole.CORROBORATING)
      .map((item) => item.sourceId),
  ).size;

  const requirement = getCorroborationRequirement({
    sensitivity: plan.sensitivity,
    riskLevel: plan.riskLevel,
  });

  if (supportingCount < requirement.minimumIndependentSupportingSources) {
    return VerificationResearchPhase.CORROBORATION;
  }

  const contradictionRequired = plan.steps.find(
    (step) => step.phase === VerificationResearchPhase.CONTRADICTION_CHECK,
  )?.required ?? false;

  const hasContradictionCheckEvidence = unique.some(
    (item) => item.stance === 'CONTRADICTING' || item.role === SourceRole.CONTRADICTING,
  );

  if (contradictionRequired && !hasContradictionCheckEvidence) {
    return VerificationResearchPhase.CONTRADICTION_CHECK;
  }

  return null;
};

export const evaluateVerificationResearchProgress = (input: {
  readonly plan: VerificationResearchPlan;
  readonly evidence: readonly ResearchEvidenceDescriptor[];
  readonly contradictionSearchCompleted: boolean;
}): VerificationResearchProgress => {
  const unique = uniqueEvidence(input.evidence);

  const authoritativeContradiction = unique.some(
    (item) =>
      item.stance === 'CONTRADICTING' &&
      item.credibilityBand === SourceCredibilityBand.AUTHORITATIVE,
  );

  if (authoritativeContradiction) {
    return {
      decision: VerificationResearchDecision.STOP_CONTRADICTED,
      nextPhase: null,
      reasons: ['AUTHORITATIVE_CONTRADICTION_FOUND'],
    };
  }

  if (unique.length >= input.plan.maxTotalSources) {
    return {
      decision: VerificationResearchDecision.STOP_BUDGET_EXHAUSTED,
      nextPhase: null,
      reasons: ['RESEARCH_SOURCE_BUDGET_EXHAUSTED'],
    };
  }

  const supportingSources = unique
    .filter((item) => item.stance === 'SUPPORTING')
    .map((item) => ({
      sourceId: item.sourceId,
      sourceType: item.sourceType,
      credibilityBand: item.credibilityBand,
      role: item.role,
    }));

  const requirement = getCorroborationRequirement({
    sensitivity: input.plan.sensitivity,
    riskLevel: input.plan.riskLevel,
  });
  const corroboration = assessCorroboration({ sources: supportingSources, requirement });

  const contradictionRequired = input.plan.steps.find(
    (step) => step.phase === VerificationResearchPhase.CONTRADICTION_CHECK,
  )?.required ?? false;

  if (
    corroboration.satisfied &&
    (!contradictionRequired || input.contradictionSearchCompleted)
  ) {
    return {
      decision: VerificationResearchDecision.STOP_SUFFICIENT,
      nextPhase: null,
      reasons: ['CORROBORATION_REQUIREMENTS_SATISFIED'],
    };
  }

  const nextPhase = nextRequiredPhase(input.plan, unique);
  if (
    nextPhase === VerificationResearchPhase.CONTRADICTION_CHECK &&
    input.contradictionSearchCompleted
  ) {
    return {
      decision: VerificationResearchDecision.STOP_SUFFICIENT,
      nextPhase: null,
      reasons: ['CORROBORATION_REQUIREMENTS_SATISFIED', 'CONTRADICTION_CHECK_COMPLETED'],
    };
  }

  return {
    decision: VerificationResearchDecision.CONTINUE,
    nextPhase,
    reasons: corroboration.missing.length > 0
      ? corroboration.missing
      : ['ADDITIONAL_RESEARCH_REQUIRED'],
  };
};
