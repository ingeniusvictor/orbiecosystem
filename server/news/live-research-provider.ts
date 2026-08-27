import {
  RiskLevel,
  SourceRole,
  VerificationStatus,
} from '../../domain/common/enums';
import type {
  EventId,
  IsoUtcDateTime,
  NewsItemId,
  SourceId,
  VerificationRecordId,
} from '../../domain/common/types';
import { EventStatus, type EventRecord } from '../../domain/events/event';
import type { SourceRegistryEntry, SourceRegistryRepository } from '../../domain/discovery/source-registry';
import {
  VerificationResearchDecision,
  buildVerificationResearchPlan,
  evaluateVerificationResearchProgress,
} from '../../domain/verification/research-strategy';
import { verificationConfidenceFromScore } from '../../domain/verification/policy';
import type { VerificationEvidence, VerificationRecord } from '../../domain/verification/verification';
import type { VerifiedEditorialClaim, VerifiedEditorialSource } from '../../domain/editorial/canonical-story-builder';
import type { LiveArticleFetcher } from './live-article-fetcher';
import type { GroundedResearchAssessment, GroundedResearchClient } from './grounded-research-client';
import type { LiveNewsCandidate, LiveNewsResearchProvider, LiveResearchBundle } from './live-processing-pipeline';

const normalizeHost = (value: string): string => value.trim().toLowerCase().replace(/^www\./, '');

const sourceForUrl = async (
  registry: SourceRegistryRepository,
  url: string,
): Promise<SourceRegistryEntry | null> => {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') return null;
  return registry.findByDomain(normalizeHost(parsed.hostname));
};

const required = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label}_REQUIRED`);
  return normalized;
};

const assertScore = (label: string, value: number): number => {
  if (!Number.isFinite(value) || value < 0 || value > 100) throw new RangeError(`${label}_INVALID`);
  return value;
};

const toEventId = (candidateId: string): EventId => `event-${candidateId}` as EventId;
const toVerificationId = (candidateId: string): VerificationRecordId => `verification-${candidateId}` as VerificationRecordId;

const mapAssessment = async ({
  candidate,
  assessment,
  registry,
  now,
}: {
  readonly candidate: LiveNewsCandidate;
  readonly assessment: GroundedResearchAssessment;
  readonly registry: SourceRegistryRepository;
  readonly now: IsoUtcDateTime;
}): Promise<LiveResearchBundle> => {
  assertScore('LIVE_RESEARCH_VERIFICATION_CONFIDENCE', assessment.verificationConfidenceScore);

  const acceptedEvidence: Array<{
    readonly item: GroundedResearchAssessment['evidence'][number];
    readonly source: SourceRegistryEntry;
  }> = [];

  for (const item of assessment.evidence) {
    const source = await sourceForUrl(registry, item.url);
    if (!source) continue;
    acceptedEvidence.push({ item, source });
  }

  const evidence: VerificationEvidence[] = acceptedEvidence.map(({ item, source }) => ({
    sourceId: source.id,
    newsItemId: candidate.id as NewsItemId,
    role: item.stance === 'CONTRADICTING'
      ? SourceRole.CONTRADICTING
      : source.isPrimaryPreferred
        ? SourceRole.PRIMARY
        : SourceRole.CORROBORATING,
    stance: item.stance,
    credibilityBand: source.credibilityBand,
    claimSummary: required('LIVE_RESEARCH_EVIDENCE_CLAIM', item.claimSummary),
    sourceUrl: item.url,
    publishedAt: item.publishedAt as IsoUtcDateTime | null,
    retrievedAt: now,
  }));

  const researchEvidence = acceptedEvidence.map(({ item, source }) => ({
    sourceId: source.id,
    sourceType: source.sourceType,
    credibilityBand: source.credibilityBand,
    role: item.stance === 'CONTRADICTING'
      ? SourceRole.CONTRADICTING
      : source.isPrimaryPreferred
        ? SourceRole.PRIMARY
        : SourceRole.CORROBORATING,
    stance: item.stance,
  }));

  const plan = buildVerificationResearchPlan({
    sensitivity: assessment.sensitivity,
    riskLevel: assessment.riskLevel,
  });
  const researchProgress = evaluateVerificationResearchProgress({
    plan,
    evidence: researchEvidence,
    contradictionSearchCompleted: assessment.contradictionSearchCompleted,
  });

  const confidence = verificationConfidenceFromScore(assessment.verificationConfidenceScore);
  const hasContradiction = acceptedEvidence.some(({ item }) => item.stance === 'CONTRADICTING');
  const status = hasContradiction
    ? VerificationStatus.CONTRADICTED
    : researchProgress.decision === VerificationResearchDecision.STOP_SUFFICIENT
      ? VerificationStatus.VERIFIED
      : VerificationStatus.PARTIALLY_VERIFIED;

  const primary = acceptedEvidence.find(({ item, source }) =>
    item.stance === 'SUPPORTING' && source.isPrimaryPreferred,
  )?.source.id ?? acceptedEvidence.find(({ item }) => item.stance === 'SUPPORTING')?.source.id ?? null;

  const claims = assessment.claims.map((claim) => {
    assertScore('LIVE_RESEARCH_CLAIM_CONFIDENCE', claim.confidenceScore);
    const supporting = evidence.filter((item) =>
      claim.evidenceUrls.includes(item.sourceUrl) && item.stance === 'SUPPORTING',
    );
    const contradicting = evidence.filter((item) =>
      claim.evidenceUrls.includes(item.sourceUrl) && item.stance === 'CONTRADICTING',
    );
    return {
      claimId: required('LIVE_RESEARCH_CLAIM_KEY', claim.key),
      statement: required('LIVE_RESEARCH_CLAIM_STATEMENT', claim.statement),
      status: contradicting.length > 0 ? VerificationStatus.CONTRADICTED : supporting.length > 0 ? VerificationStatus.VERIFIED : VerificationStatus.UNVERIFIED,
      confidenceScore: claim.confidenceScore,
      confidence: verificationConfidenceFromScore(claim.confidenceScore),
      supportingEvidence: supporting,
      contradictingEvidence: contradicting,
    };
  });

  const verificationRecord: VerificationRecord = {
    id: toVerificationId(candidate.id),
    organizationId: candidate.organizationId,
    newsItemId: candidate.id as NewsItemId,
    eventId: toEventId(candidate.id),
    status,
    confidenceScore: assessment.verificationConfidenceScore,
    confidence,
    claims,
    evidence,
    risk: {
      level: assessment.riskLevel,
      reasons: assessment.riskReasons,
      notes: assessment.riskNotes,
    },
    primarySourceId: primary,
    startedAt: candidate.discoveredAt,
    completedAt: now,
    verificationVersion: 'ORBI_LIVE_RESEARCH_V1',
  };

  const event: EventRecord = {
    id: toEventId(candidate.id),
    organizationId: candidate.organizationId,
    status: hasContradiction ? EventStatus.DISPUTED : EventStatus.CONFIRMED,
    eventType: assessment.event.eventType,
    primaryEntity: required('LIVE_RESEARCH_EVENT_PRIMARY_ENTITY', assessment.event.primaryEntity),
    subject: assessment.event.subject?.trim() || null,
    canonicalSummary: required('LIVE_RESEARCH_EVENT_SUMMARY', assessment.event.canonicalSummary),
    firstObservedAt: candidate.discoveredAt,
    eventDateCandidate: assessment.event.confirmedEventDate as IsoUtcDateTime | null,
    confirmedEventDate: assessment.event.confirmedEventDate as IsoUtcDateTime | null,
    confidence,
    fingerprint: {
      primaryEntity: assessment.event.primaryEntity,
      eventType: assessment.event.eventType,
      subject: assessment.event.subject,
      dateBucket: assessment.event.confirmedEventDate?.slice(0, 10) ?? null,
      secondaryEntities: [],
      location: null,
      fingerprintHash: `live-${candidate.id}`,
    },
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  const verifiedClaims: VerifiedEditorialClaim[] = claims
    .filter((claim) => claim.status === VerificationStatus.VERIFIED)
    .map((claim) => ({ key: claim.claimId, statement: claim.statement }));

  const uniqueSourceIds = new Set<SourceId>();
  const verifiedSources: VerifiedEditorialSource[] = [];
  for (const { item, source } of acceptedEvidence) {
    if (item.stance !== 'SUPPORTING' || uniqueSourceIds.has(source.id)) continue;
    uniqueSourceIds.add(source.id);
    verifiedSources.push({
      sourceKey: normalizeHost(source.domain),
      label: source.name,
      url: item.url,
      isPrimary: source.id === primary,
    });
  }

  return {
    verificationRecord,
    sensitivity: assessment.sensitivity,
    researchProgress,
    researchEvidence,
    event,
    hasEventContradiction: hasContradiction,
    scoreDimensions: assessment.scoreDimensions,
    proposal: assessment.proposal,
    verifiedClaims,
    verifiedSources,
    grounding: {
      valid: assessment.groundingValid && verifiedClaims.length > 0 && verifiedSources.length > 0,
      reasons: assessment.groundingReasons,
    },
  };
};

/**
 * Live provider boundary: fetches the discovered article, asks a grounded client
 * for research, then independently validates every evidence URL against the
 * Source Registry before creating authoritative domain records.
 */
export const createLiveResearchProvider = ({
  articleFetcher,
  groundedClient,
  sourceRegistry,
  clock = () => new Date().toISOString() as IsoUtcDateTime,
}: {
  readonly articleFetcher: LiveArticleFetcher;
  readonly groundedClient: GroundedResearchClient;
  readonly sourceRegistry: SourceRegistryRepository;
  readonly clock?: () => IsoUtcDateTime;
}): LiveNewsResearchProvider => ({
  async research(candidate: LiveNewsCandidate): Promise<LiveResearchBundle> {
    const primaryArticle = await articleFetcher.fetchArticle(candidate.url);
    const activeSources = await sourceRegistry.listActive();
    if (activeSources.length === 0) throw new Error('LIVE_RESEARCH_SOURCE_REGISTRY_EMPTY');

    const assessment = await groundedClient.research({
      candidate,
      primaryArticle,
      allowedSources: activeSources.map((source) => ({
        name: source.name,
        domain: source.domain,
        homepageUrl: source.homepageUrl,
        sourceType: source.sourceType,
        credibilityBand: source.credibilityBand,
        isPrimaryPreferred: source.isPrimaryPreferred,
      })),
    });

    if (assessment.riskLevel === RiskLevel.CRITICAL) {
      // Preserve the record so the deterministic verification gate can BLOCK it.
    }

    return mapAssessment({ candidate, assessment, registry: sourceRegistry, now: clock() });
  },
});
