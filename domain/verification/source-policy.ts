import {
  RiskLevel,
  SourceCredibilityBand,
  SourceRole,
  SourceType,
} from '../common/enums';
import type { SourceId } from '../common/types';

export interface VerificationSourceDescriptor {
  readonly sourceId: SourceId;
  readonly sourceType: SourceType;
  readonly credibilityBand: SourceCredibilityBand;
  readonly role: SourceRole;
}

export interface PrimarySourceResolution {
  readonly primarySourceId: SourceId | null;
  readonly eligibleSourceIds: readonly SourceId[];
  readonly reasons: readonly string[];
}

const PRIMARY_SOURCE_TYPES = new Set<SourceType>([
  SourceType.OFFICIAL,
  SourceType.GOVERNMENT,
  SourceType.ACADEMIC,
  SourceType.COMPANY_BLOG,
  SourceType.PRESS_RELEASE,
  SourceType.SOCIAL_OFFICIAL,
]);

export const isEligiblePrimarySource = (
  source: VerificationSourceDescriptor,
): boolean =>
  source.role === SourceRole.PRIMARY &&
  PRIMARY_SOURCE_TYPES.has(source.sourceType) &&
  (source.credibilityBand === SourceCredibilityBand.HIGH ||
    source.credibilityBand === SourceCredibilityBand.AUTHORITATIVE);

const primaryRank = (source: VerificationSourceDescriptor): number => {
  const credibility = source.credibilityBand === SourceCredibilityBand.AUTHORITATIVE ? 100 : 70;
  const typeRank: Partial<Record<SourceType, number>> = {
    [SourceType.GOVERNMENT]: 30,
    [SourceType.OFFICIAL]: 30,
    [SourceType.ACADEMIC]: 28,
    [SourceType.PRESS_RELEASE]: 26,
    [SourceType.COMPANY_BLOG]: 24,
    [SourceType.SOCIAL_OFFICIAL]: 18,
  };
  return credibility + (typeRank[source.sourceType] ?? 0);
};

export const resolvePrimarySource = (
  sources: readonly VerificationSourceDescriptor[],
): PrimarySourceResolution => {
  const eligible = sources.filter(isEligiblePrimarySource);
  const ranked = [...eligible].sort((a, b) => primaryRank(b) - primaryRank(a));

  return {
    primarySourceId: ranked[0]?.sourceId ?? null,
    eligibleSourceIds: ranked.map((source) => source.sourceId),
    reasons: ranked.length > 0
      ? ['ELIGIBLE_PRIMARY_SOURCE_FOUND']
      : ['NO_ELIGIBLE_PRIMARY_SOURCE'],
  };
};

export enum ClaimSensitivity {
  STANDARD = 'STANDARD',
  HIGH_IMPACT = 'HIGH_IMPACT',
  SENSITIVE = 'SENSITIVE',
}

export interface CorroborationRequirement {
  readonly minimumIndependentSupportingSources: number;
  readonly primarySourceRequired: boolean;
  readonly authoritativeSourceRequired: boolean;
}

export interface CorroborationAssessment {
  readonly satisfied: boolean;
  readonly supportingSourceCount: number;
  readonly missing: readonly string[];
}

export const getCorroborationRequirement = (input: {
  readonly sensitivity: ClaimSensitivity;
  readonly riskLevel: RiskLevel;
}): CorroborationRequirement => {
  if (input.riskLevel === RiskLevel.CRITICAL || input.sensitivity === ClaimSensitivity.SENSITIVE) {
    return {
      minimumIndependentSupportingSources: 2,
      primarySourceRequired: true,
      authoritativeSourceRequired: true,
    };
  }

  if (input.riskLevel === RiskLevel.HIGH || input.sensitivity === ClaimSensitivity.HIGH_IMPACT) {
    return {
      minimumIndependentSupportingSources: 2,
      primarySourceRequired: true,
      authoritativeSourceRequired: false,
    };
  }

  return {
    minimumIndependentSupportingSources: 1,
    primarySourceRequired: false,
    authoritativeSourceRequired: false,
  };
};

export const assessCorroboration = (input: {
  readonly sources: readonly VerificationSourceDescriptor[];
  readonly requirement: CorroborationRequirement;
}): CorroborationAssessment => {
  const supporting = input.sources.filter(
    (source) => source.role === SourceRole.PRIMARY || source.role === SourceRole.CORROBORATING,
  );
  const uniqueSupporting = new Map(supporting.map((source) => [source.sourceId, source]));
  const resolved = [...uniqueSupporting.values()];
  const missing: string[] = [];

  if (resolved.length < input.requirement.minimumIndependentSupportingSources) {
    missing.push('INSUFFICIENT_INDEPENDENT_SUPPORTING_SOURCES');
  }

  if (input.requirement.primarySourceRequired && !resolved.some(isEligiblePrimarySource)) {
    missing.push('PRIMARY_SOURCE_REQUIRED');
  }

  if (
    input.requirement.authoritativeSourceRequired &&
    !resolved.some((source) => source.credibilityBand === SourceCredibilityBand.AUTHORITATIVE)
  ) {
    missing.push('AUTHORITATIVE_SOURCE_REQUIRED');
  }

  return {
    satisfied: missing.length === 0,
    supportingSourceCount: resolved.length,
    missing,
  };
};
