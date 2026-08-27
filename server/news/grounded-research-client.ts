import type { ContentCategory, RiskLevel, RiskReason } from '../../domain/common/enums';
import type { EventType } from '../../domain/events/event';
import type { CanonicalStoryProposal } from '../../domain/editorial/canonical-story-builder';
import type { OrbiEditorialScoreDimensions } from '../../domain/editorial/scoring';
import type { ClaimSensitivity } from '../../domain/verification/source-policy';
import type { LiveArticleDocument } from './live-article-fetcher';
import type { LiveNewsCandidate } from './live-processing-pipeline';

export type GroundedEvidenceStance = 'SUPPORTING' | 'CONTRADICTING' | 'NEUTRAL';

export interface GroundedResearchEvidence {
  readonly url: string;
  readonly stance: GroundedEvidenceStance;
  readonly claimSummary: string;
  readonly publishedAt: string | null;
}

export interface GroundedResearchClaim {
  readonly key: string;
  readonly statement: string;
  readonly confidenceScore: number;
  readonly evidenceUrls: readonly string[];
}

export interface GroundedResearchAssessment {
  readonly sensitivity: ClaimSensitivity;
  readonly riskLevel: RiskLevel;
  readonly riskReasons: readonly RiskReason[];
  readonly riskNotes: readonly string[];
  readonly verificationConfidenceScore: number;
  readonly claims: readonly GroundedResearchClaim[];
  readonly evidence: readonly GroundedResearchEvidence[];
  readonly contradictionSearchCompleted: boolean;
  readonly event: {
    readonly eventType: EventType;
    readonly primaryEntity: string;
    readonly subject: string | null;
    readonly canonicalSummary: string;
    readonly confirmedEventDate: string | null;
  };
  readonly scoreDimensions: OrbiEditorialScoreDimensions;
  readonly proposal: CanonicalStoryProposal;
  readonly groundingValid: boolean;
  readonly groundingReasons: readonly string[];
}

export interface GroundedResearchSourceDescriptor {
  readonly name: string;
  readonly domain: string;
  readonly homepageUrl: string;
  readonly sourceType: string;
  readonly credibilityBand: string;
  readonly isPrimaryPreferred: boolean;
}

export interface GroundedResearchClient {
  research(input: {
    readonly candidate: LiveNewsCandidate;
    readonly primaryArticle: LiveArticleDocument;
    readonly allowedSources: readonly GroundedResearchSourceDescriptor[];
  }): Promise<GroundedResearchAssessment>;
}
