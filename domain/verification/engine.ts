import {
  RiskLevel,
  RiskReason,
  SourceCredibilityBand,
  SourceRole,
  VerificationStatus,
} from '../common/enums';
import type {
  IsoUtcDateTime,
  NewsItemId,
  OrganizationId,
  SourceId,
  VerificationRecordId,
} from '../common/types';
import type {
  EvidenceStance,
  VerificationClaim,
  VerificationEvidence,
  VerificationRecord,
} from './verification';
import { verificationConfidenceFromScore } from './policy';

export interface VerificationSubject {
  readonly organizationId: OrganizationId;
  readonly newsItemId: NewsItemId;
  readonly title: string;
  readonly canonicalUrl: string;
  readonly sourceId: SourceId;
  readonly publishedAt: IsoUtcDateTime | null;
}

export interface VerificationResearchResult {
  readonly sourceId: SourceId;
  readonly sourceUrl: string;
  readonly role: SourceRole;
  readonly credibilityBand: SourceCredibilityBand;
  readonly stance: EvidenceStance;
  readonly claimSummary: string;
  readonly publishedAt: IsoUtcDateTime | null;
}

export interface VerificationResearchProvider {
  readonly id: string;
  research(subject: VerificationSubject): Promise<readonly VerificationResearchResult[]>;
}

export interface ClaimProposal {
  readonly claimId: string;
  readonly statement: string;
  readonly supportingSourceIds: readonly SourceId[];
  readonly contradictingSourceIds: readonly SourceId[];
}

export interface ClaimExtractor {
  readonly id: string;
  proposeClaims(input: {
    readonly subject: VerificationSubject;
    readonly evidence: readonly VerificationEvidence[];
  }): Promise<readonly ClaimProposal[]>;
}

export interface VerificationIdFactory {
  nextVerificationRecordId(): VerificationRecordId;
}

export interface VerificationClock {
  now(): IsoUtcDateTime;
}

const credibilityPoints: Readonly<Record<SourceCredibilityBand, number>> = {
  [SourceCredibilityBand.UNKNOWN]: 0,
  [SourceCredibilityBand.LOW]: 20,
  [SourceCredibilityBand.MODERATE]: 50,
  [SourceCredibilityBand.HIGH]: 75,
  [SourceCredibilityBand.AUTHORITATIVE]: 100,
};

const evidenceForClaim = (
  proposal: ClaimProposal,
  evidence: readonly VerificationEvidence[],
  stance: EvidenceStance,
): readonly VerificationEvidence[] => {
  const ids = stance === 'CONTRADICTING'
    ? new Set(proposal.contradictingSourceIds)
    : new Set(proposal.supportingSourceIds);
  return evidence.filter((item) => ids.has(item.sourceId) && item.stance === stance);
};

export const calculateClaimConfidenceScore = (
  supporting: readonly VerificationEvidence[],
  contradicting: readonly VerificationEvidence[],
): number => {
  if (supporting.length === 0) return 0;

  const supportAverage = supporting.reduce(
    (sum, item) => sum + credibilityPoints[item.credibilityBand],
    0,
  ) / supporting.length;

  const contradictionPenalty = contradicting.reduce(
    (sum, item) => sum + credibilityPoints[item.credibilityBand] * 0.6,
    0,
  ) / Math.max(1, contradicting.length);

  return Math.max(0, Math.min(100, Math.round(supportAverage - contradictionPenalty)));
};

export const resolveVerificationStatus = (
  claims: readonly VerificationClaim[],
): VerificationStatus => {
  if (claims.length === 0) return VerificationStatus.UNVERIFIED;
  if (claims.some((claim) => claim.status === VerificationStatus.CONTRADICTED)) {
    return VerificationStatus.CONTRADICTED;
  }
  if (claims.every((claim) => claim.status === VerificationStatus.VERIFIED)) {
    return VerificationStatus.VERIFIED;
  }
  if (claims.some((claim) => claim.status === VerificationStatus.VERIFIED)) {
    return VerificationStatus.PARTIALLY_VERIFIED;
  }
  return VerificationStatus.UNVERIFIED;
};

const buildClaim = (
  proposal: ClaimProposal,
  evidence: readonly VerificationEvidence[],
): VerificationClaim => {
  const supportingEvidence = evidenceForClaim(proposal, evidence, 'SUPPORTING');
  const contradictingEvidence = evidenceForClaim(proposal, evidence, 'CONTRADICTING');
  const confidenceScore = calculateClaimConfidenceScore(supportingEvidence, contradictingEvidence);

  let status = VerificationStatus.UNVERIFIED;
  if (contradictingEvidence.length > 0) status = VerificationStatus.CONTRADICTED;
  else if (supportingEvidence.length > 0 && confidenceScore >= 70) status = VerificationStatus.VERIFIED;
  else if (supportingEvidence.length > 0) status = VerificationStatus.PARTIALLY_VERIFIED;

  return {
    claimId: proposal.claimId,
    statement: proposal.statement.trim(),
    status,
    confidenceScore,
    confidence: verificationConfidenceFromScore(confidenceScore),
    supportingEvidence,
    contradictingEvidence,
  };
};

const buildRiskAssessment = (
  claims: readonly VerificationClaim[],
  evidence: readonly VerificationEvidence[],
): VerificationRecord['risk'] => {
  const reasons: RiskReason[] = [];
  const notes: string[] = [];

  if (claims.length === 0 || claims.every((claim) => claim.status === VerificationStatus.UNVERIFIED)) {
    reasons.push(RiskReason.UNVERIFIED_CLAIM);
  }
  if (claims.some((claim) => claim.status === VerificationStatus.CONTRADICTED)) {
    reasons.push(RiskReason.SOURCE_CONFLICT);
    notes.push('At least one material claim has contradicting evidence.');
  }

  const hasAuthoritativeContradiction = evidence.some(
    (item) => item.stance === 'CONTRADICTING' && item.credibilityBand === SourceCredibilityBand.AUTHORITATIVE,
  );

  if (hasAuthoritativeContradiction) {
    return { level: RiskLevel.HIGH, reasons, notes };
  }
  if (reasons.includes(RiskReason.SOURCE_CONFLICT)) {
    return { level: RiskLevel.MEDIUM, reasons, notes };
  }
  if (reasons.includes(RiskReason.UNVERIFIED_CLAIM)) {
    return { level: RiskLevel.MEDIUM, reasons, notes };
  }
  return { level: RiskLevel.LOW, reasons, notes };
};

export class VerificationEngine {
  constructor(
    private readonly researchProvider: VerificationResearchProvider,
    private readonly claimExtractor: ClaimExtractor,
    private readonly idFactory: VerificationIdFactory,
    private readonly clock: VerificationClock,
  ) {}

  async verify(subject: VerificationSubject): Promise<VerificationRecord> {
    const startedAt = this.clock.now();
    const research = await this.researchProvider.research(subject);
    const retrievedAt = this.clock.now();

    const evidence: VerificationEvidence[] = research.map((item) => ({
      sourceId: item.sourceId,
      newsItemId: subject.newsItemId,
      role: item.role,
      stance: item.stance,
      credibilityBand: item.credibilityBand,
      claimSummary: item.claimSummary.trim(),
      sourceUrl: item.sourceUrl,
      publishedAt: item.publishedAt,
      retrievedAt,
    }));

    const proposals = await this.claimExtractor.proposeClaims({ subject, evidence });
    const claims = proposals
      .filter((proposal) => proposal.statement.trim().length > 0)
      .map((proposal) => buildClaim(proposal, evidence));

    const status = resolveVerificationStatus(claims);
    const confidenceScore = claims.length === 0
      ? 0
      : Math.round(claims.reduce((sum, claim) => sum + claim.confidenceScore, 0) / claims.length);

    const primary = evidence.find((item) => item.role === SourceRole.PRIMARY) ?? null;

    return {
      id: this.idFactory.nextVerificationRecordId(),
      organizationId: subject.organizationId,
      newsItemId: subject.newsItemId,
      eventId: null,
      status,
      confidenceScore,
      confidence: verificationConfidenceFromScore(confidenceScore),
      claims,
      evidence,
      risk: buildRiskAssessment(claims, evidence),
      primarySourceId: primary?.sourceId ?? null,
      startedAt,
      completedAt: this.clock.now(),
      verificationVersion: 'ORBI_VERIFY_V1',
    };
  }
}
