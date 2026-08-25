import type {
  RiskLevel,
  RiskReason,
  SourceCredibilityBand,
  SourceRole,
  VerificationConfidence,
  VerificationStatus,
} from '../common/enums';
import type {
  EventId,
  IsoUtcDateTime,
  NewsItemId,
  OrganizationId,
  SourceId,
  VerificationRecordId,
} from '../common/types';

export type EvidenceStance = 'SUPPORTING' | 'CONTRADICTING' | 'NEUTRAL';

export interface VerificationEvidence {
  readonly sourceId: SourceId;
  readonly newsItemId: NewsItemId;
  readonly role: SourceRole;
  readonly stance: EvidenceStance;
  readonly credibilityBand: SourceCredibilityBand;
  readonly claimSummary: string;
  readonly sourceUrl: string;
  readonly publishedAt: IsoUtcDateTime | null;
  readonly retrievedAt: IsoUtcDateTime;
}

export interface VerificationClaim {
  readonly claimId: string;
  readonly statement: string;
  readonly status: VerificationStatus;
  readonly confidenceScore: number;
  readonly confidence: VerificationConfidence;
  readonly supportingEvidence: readonly VerificationEvidence[];
  readonly contradictingEvidence: readonly VerificationEvidence[];
}

export interface VerificationRiskAssessment {
  readonly level: RiskLevel;
  readonly reasons: readonly RiskReason[];
  readonly notes: readonly string[];
}

export interface VerificationRecord {
  readonly id: VerificationRecordId;
  readonly organizationId: OrganizationId;
  readonly newsItemId: NewsItemId;
  readonly eventId: EventId | null;
  readonly status: VerificationStatus;
  readonly confidenceScore: number;
  readonly confidence: VerificationConfidence;
  readonly claims: readonly VerificationClaim[];
  readonly evidence: readonly VerificationEvidence[];
  readonly risk: VerificationRiskAssessment;
  readonly primarySourceId: SourceId | null;
  readonly startedAt: IsoUtcDateTime;
  readonly completedAt: IsoUtcDateTime | null;
  readonly verificationVersion: string;
}

export enum VerificationDecision {
  ALLOW_EDITORIAL_PIPELINE = 'ALLOW_EDITORIAL_PIPELINE',
  REQUIRE_HUMAN_REVIEW = 'REQUIRE_HUMAN_REVIEW',
  BLOCK = 'BLOCK',
  DEFER = 'DEFER',
}

export interface VerificationGateResult {
  readonly decision: VerificationDecision;
  readonly reasons: readonly string[];
}
