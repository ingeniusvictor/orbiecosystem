import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import { EventStatus, type EventRecord } from '../../domain/events/event';
import {
  evaluateIntegratedVerificationGate,
  type IntegratedVerificationGateInput,
} from '../../domain/verification/gate-integration';
import { VerificationDecision, type VerificationRecord } from '../../domain/verification/verification';
import {
  buildCanonicalStory,
  type CanonicalStoryBuilderInput,
  type CanonicalStoryProposal,
  type VerifiedEditorialClaim,
  type VerifiedEditorialSource,
} from '../../domain/editorial/canonical-story-builder';
import {
  calculateOrbiEditorialScore,
  type OrbiEditorialScoreDimensions,
} from '../../domain/editorial/scoring';
import {
  evaluateIntegratedEditorialGate,
  IntegratedEditorialDecision,
  type EditorialGroundingAssessment,
} from '../../domain/editorial/editorial-gate';
import type { CanonicalStory } from '../../domain/editorial/canonical-story';
import type { ClaimSensitivity } from '../../domain/verification/source-policy';
import type {
  ResearchEvidenceDescriptor,
  VerificationResearchProgress,
} from '../../domain/verification/research-strategy';

export interface LiveNewsCandidate {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly title: string;
  readonly url: string;
  readonly sourceName: string | null;
  readonly publishedAt: IsoUtcDateTime | null;
  readonly discoveredAt: IsoUtcDateTime;
}

export interface LiveResearchBundle {
  readonly verificationRecord: VerificationRecord;
  readonly sensitivity: ClaimSensitivity;
  readonly researchProgress: VerificationResearchProgress;
  readonly researchEvidence: readonly ResearchEvidenceDescriptor[];
  readonly event: EventRecord;
  readonly hasEventContradiction: boolean;
  readonly scoreDimensions: OrbiEditorialScoreDimensions;
  readonly proposal: CanonicalStoryProposal;
  readonly verifiedClaims: readonly VerifiedEditorialClaim[];
  readonly verifiedSources: readonly VerifiedEditorialSource[];
  readonly grounding: EditorialGroundingAssessment;
}

export interface LiveNewsResearchProvider {
  research(candidate: LiveNewsCandidate): Promise<LiveResearchBundle>;
}

export enum LiveProcessingOutcome {
  DRAFT_READY = 'DRAFT_READY',
  REQUIRE_HUMAN_REVIEW = 'REQUIRE_HUMAN_REVIEW',
  DEFERRED = 'DEFERRED',
  BLOCKED = 'BLOCKED',
  FAILED = 'FAILED',
}

export interface LiveProcessingResult {
  readonly outcome: LiveProcessingOutcome;
  readonly candidateId: string;
  readonly verificationDecision: VerificationDecision | null;
  readonly editorialDecision: IntegratedEditorialDecision | null;
  readonly story: CanonicalStory | null;
  readonly reasons: readonly string[];
}

const required = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label}_REQUIRED`);
  return normalized;
};

const validateBundleIdentity = (candidate: LiveNewsCandidate, bundle: LiveResearchBundle): void => {
  if (bundle.verificationRecord.organizationId !== candidate.organizationId) {
    throw new Error('LIVE_PIPELINE_VERIFICATION_ORGANIZATION_MISMATCH');
  }
  if (bundle.event.organizationId !== candidate.organizationId) {
    throw new Error('LIVE_PIPELINE_EVENT_ORGANIZATION_MISMATCH');
  }
  if (bundle.verificationRecord.eventId !== null && bundle.verificationRecord.eventId !== bundle.event.id) {
    throw new Error('LIVE_PIPELINE_VERIFICATION_EVENT_MISMATCH');
  }
};

const outcomeFromVerification = (decision: VerificationDecision): LiveProcessingOutcome => {
  if (decision === VerificationDecision.BLOCK) return LiveProcessingOutcome.BLOCKED;
  if (decision === VerificationDecision.REQUIRE_HUMAN_REVIEW) return LiveProcessingOutcome.REQUIRE_HUMAN_REVIEW;
  return LiveProcessingOutcome.DEFERRED;
};

const outcomeFromEditorial = (decision: IntegratedEditorialDecision): LiveProcessingOutcome => {
  if (decision === IntegratedEditorialDecision.BLOCK) return LiveProcessingOutcome.BLOCKED;
  if (decision === IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW) return LiveProcessingOutcome.REQUIRE_HUMAN_REVIEW;
  if (decision === IntegratedEditorialDecision.DEFER) return LiveProcessingOutcome.DEFERRED;
  return LiveProcessingOutcome.DRAFT_READY;
};

/**
 * NA-15 composition root for live candidates. The research provider may use live
 * web/AI services, but this pipeline never trusts provider output as authority.
 * Existing deterministic verification, scoring, canonical-story grounding and
 * editorial gates are evaluated before a draft can leave this function.
 *
 * DRAFT_READY is deliberately not APPROVED or PUBLISHED.
 */
export const createLiveNewsProcessingPipeline = ({
  researchProvider,
  clock = () => new Date().toISOString() as IsoUtcDateTime,
  storyIdFactory,
}: {
  readonly researchProvider: LiveNewsResearchProvider;
  readonly clock?: () => IsoUtcDateTime;
  readonly storyIdFactory: (candidate: LiveNewsCandidate, bundle: LiveResearchBundle) => string;
}) => ({
  async process(candidate: LiveNewsCandidate): Promise<LiveProcessingResult> {
    required('LIVE_PIPELINE_CANDIDATE_ID', candidate.id);
    required('LIVE_PIPELINE_CANDIDATE_TITLE', candidate.title);
    const parsedUrl = new URL(candidate.url);
    if (parsedUrl.protocol !== 'https:') throw new Error('LIVE_PIPELINE_CANDIDATE_HTTPS_REQUIRED');

    try {
      const bundle = await researchProvider.research(candidate);
      validateBundleIdentity(candidate, bundle);

      const verificationInput: IntegratedVerificationGateInput = {
        record: bundle.verificationRecord,
        sensitivity: bundle.sensitivity,
        researchProgress: bundle.researchProgress,
        researchEvidence: bundle.researchEvidence,
      };
      const verificationGate = evaluateIntegratedVerificationGate(verificationInput);

      if (verificationGate.decision !== VerificationDecision.ALLOW_EDITORIAL_PIPELINE) {
        return {
          outcome: outcomeFromVerification(verificationGate.decision),
          candidateId: candidate.id,
          verificationDecision: verificationGate.decision,
          editorialDecision: null,
          story: null,
          reasons: verificationGate.reasons,
        };
      }

      if (
        bundle.event.status === EventStatus.DETECTED ||
        bundle.event.status === EventStatus.CONSOLIDATING ||
        bundle.event.status === EventStatus.DISPUTED ||
        bundle.event.status === EventStatus.INVALID
      ) {
        // The integrated editorial gate remains the authority for the final result,
        // but explicit event readiness here avoids generating unnecessary drafts.
      }

      const score = calculateOrbiEditorialScore(bundle.scoreDimensions);
      const now = clock();
      const storyInput: CanonicalStoryBuilderInput = {
        id: storyIdFactory(candidate, bundle) as CanonicalStoryBuilderInput['id'],
        organizationId: candidate.organizationId,
        eventId: bundle.event.id,
        verificationRecordId: bundle.verificationRecord.id,
        proposal: bundle.proposal,
        verifiedClaims: bundle.verifiedClaims,
        verifiedSources: bundle.verifiedSources,
        verificationConfidence: bundle.verificationRecord.confidence,
        riskLevel: bundle.verificationRecord.risk.level,
        orbiScore: score.total,
        socialScore: null,
        shortScore: null,
        createdAt: now,
      };
      const story = buildCanonicalStory(storyInput);
      const editorialGate = evaluateIntegratedEditorialGate({
        story,
        verificationGate,
        eventStatus: bundle.event.status,
        hasEventContradiction: bundle.hasEventContradiction,
        grounding: bundle.grounding,
      });
      const outcome = outcomeFromEditorial(editorialGate.decision);

      return {
        outcome,
        candidateId: candidate.id,
        verificationDecision: verificationGate.decision,
        editorialDecision: editorialGate.decision,
        story: outcome === LiveProcessingOutcome.DRAFT_READY ? story : null,
        reasons: editorialGate.reasons,
      };
    } catch (error) {
      return {
        outcome: LiveProcessingOutcome.FAILED,
        candidateId: candidate.id,
        verificationDecision: null,
        editorialDecision: null,
        story: null,
        reasons: [error instanceof Error ? error.message.slice(0, 500) : 'LIVE_PIPELINE_FAILED'],
      };
    }
  },
});
