import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ContentCategory,
  RiskLevel,
  SourceCredibilityBand,
  SourceRole,
  SourceType,
  VerificationConfidence,
  VerificationStatus,
} from '../../domain/common/enums';
import { EventStatus, EventType } from '../../domain/events/event';
import { ContentFormat, EditorialTone } from '../../domain/editorial/canonical-story';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { ClaimSensitivity } from '../../domain/verification/source-policy';
import { VerificationResearchDecision } from '../../domain/verification/research-strategy';
import { VerificationDecision } from '../../domain/verification/verification';
import {
  createLiveNewsProcessingPipeline,
  LiveProcessingOutcome,
  type LiveNewsCandidate,
  type LiveResearchBundle,
} from '../../server/news/live-processing-pipeline';

const now = '2026-08-27T16:30:00.000Z' as never;
const org = 'orbi-ecosystem' as never;
const primarySourceId = 'source-primary' as never;
const corroboratingSourceId = 'source-corroborating' as never;

const candidate: LiveNewsCandidate = {
  id: 'candidate-1',
  organizationId: org,
  title: 'Example AI release',
  url: 'https://example.com/release',
  sourceName: 'Example',
  publishedAt: now,
  discoveredAt: now,
};

const baseBundle = (): LiveResearchBundle => ({
  verificationRecord: {
    id: 'verification-1' as never,
    organizationId: org,
    newsItemId: 'news-1' as never,
    eventId: 'event-1' as never,
    status: VerificationStatus.VERIFIED,
    confidenceScore: 96,
    confidence: VerificationConfidence.VERY_HIGH,
    claims: [],
    evidence: [],
    risk: { level: RiskLevel.LOW, reasons: [], notes: [] },
    primarySourceId,
    startedAt: now,
    completedAt: now,
    verificationVersion: 'ORBI_VERIFY_V1',
  },
  sensitivity: ClaimSensitivity.STANDARD,
  researchProgress: {
    decision: VerificationResearchDecision.STOP_SUFFICIENT,
    nextPhase: null,
    reasons: ['CORROBORATION_REQUIREMENTS_SATISFIED'],
  },
  researchEvidence: [
    {
      sourceId: primarySourceId,
      sourceType: SourceType.OFFICIAL,
      credibilityBand: SourceCredibilityBand.AUTHORITATIVE,
      role: SourceRole.PRIMARY,
      stance: 'SUPPORTING',
    },
    {
      sourceId: corroboratingSourceId,
      sourceType: SourceType.PRIMARY_MEDIA,
      credibilityBand: SourceCredibilityBand.HIGH,
      role: SourceRole.CORROBORATING,
      stance: 'SUPPORTING',
    },
  ],
  event: {
    id: 'event-1' as never,
    organizationId: org,
    status: EventStatus.CONFIRMED,
    eventType: EventType.MODEL_RELEASE,
    primaryEntity: 'Example AI',
    subject: 'Model release',
    canonicalSummary: 'Example AI released a new model.',
    firstObservedAt: now,
    eventDateCandidate: now,
    confirmedEventDate: now,
    confidence: VerificationConfidence.VERY_HIGH,
    fingerprint: {
      primaryEntity: 'Example AI',
      eventType: EventType.MODEL_RELEASE,
      subject: 'Model release',
      dateBucket: '2026-08-27',
      secondaryEntities: [],
      location: null,
      fingerprintHash: 'hash-1',
    },
    version: 1,
    createdAt: now,
    updatedAt: now,
  },
  hasEventContradiction: false,
  scoreDimensions: {
    strategicRelevance: 90,
    audienceInterest: 90,
    practicalValue: 90,
    novelty: 90,
    timeliness: 90,
    evidenceStrength: 95,
  },
  proposal: {
    headline: 'Example AI presenta un nuevo modelo',
    dek: 'La compañía anunció oficialmente una nueva versión orientada a desarrolladores.',
    slug: 'example-ai-presenta-nuevo-modelo',
    primaryCategory: ContentCategory.AI,
    secondaryCategories: [ContentCategory.TECH],
    tone: EditorialTone.INFORMATIVE,
    format: ContentFormat.NEWS_POST,
    sections: [
      { key: 'SUMMARY', heading: 'Resumen', body: 'Example AI presentó un nuevo modelo.', claimKeys: ['claim-1'], sourceKeys: ['primary'] },
      { key: 'WHAT_HAPPENED', heading: 'Qué ocurrió', body: 'El lanzamiento fue anunciado oficialmente.', claimKeys: ['claim-1'], sourceKeys: ['primary'] },
      { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Amplía las opciones disponibles para desarrolladores.', claimKeys: ['claim-1'], sourceKeys: ['primary', 'media'] },
      { key: 'PRACTICAL_IMPACT', heading: 'Impacto práctico', body: 'Los equipos podrán evaluar una nueva alternativa técnica.', claimKeys: ['claim-1'], sourceKeys: ['primary', 'media'] },
      { key: 'ORBI_LENS', heading: 'Mirada ORBI', body: 'Conviene comparar capacidades y requisitos antes de adoptarlo.', claimKeys: ['claim-1'], sourceKeys: ['primary'] },
    ],
    sourceKeys: ['primary', 'media'],
  },
  verifiedClaims: [{ key: 'claim-1', statement: 'Example AI presentó un nuevo modelo.' }],
  verifiedSources: [
    { sourceKey: 'primary', label: 'Example AI', url: 'https://example.com/release', isPrimary: true },
    { sourceKey: 'media', label: 'Independent Media', url: 'https://media.example.com/report', isPrimary: false },
  ],
  grounding: { valid: true, reasons: [] },
});

const pipelineFor = (bundle: LiveResearchBundle) => createLiveNewsProcessingPipeline({
  researchProvider: { async research() { return bundle; } },
  clock: () => now,
  storyIdFactory: () => 'story-1',
});

test('NA-15 live pipeline produces only DRAFT_READY after verification and editorial gates allow', async () => {
  const result = await pipelineFor(baseBundle()).process(candidate);
  assert.equal(result.outcome, LiveProcessingOutcome.DRAFT_READY);
  assert.equal(result.verificationDecision, VerificationDecision.ALLOW_EDITORIAL_PIPELINE);
  assert.equal(result.editorialDecision, IntegratedEditorialDecision.ALLOW_EDITORIAL);
  assert.equal(result.story?.status, 'DRAFT_READY');
  assert.equal(result.story?.orbiScore, 91);
});

test('NA-15 live pipeline stops before generation when verification requires review', async () => {
  const bundle = baseBundle();
  const reviewBundle: LiveResearchBundle = {
    ...bundle,
    verificationRecord: {
      ...bundle.verificationRecord,
      risk: { level: RiskLevel.HIGH, reasons: [], notes: [] },
    },
  };
  const result = await pipelineFor(reviewBundle).process(candidate);
  assert.equal(result.outcome, LiveProcessingOutcome.REQUIRE_HUMAN_REVIEW);
  assert.equal(result.story, null);
});

test('NA-15 live pipeline defers unresolved events and never returns a draft', async () => {
  const bundle = baseBundle();
  const unresolved: LiveResearchBundle = {
    ...bundle,
    event: { ...bundle.event, status: EventStatus.CONSOLIDATING },
  };
  const result = await pipelineFor(unresolved).process(candidate);
  assert.equal(result.outcome, LiveProcessingOutcome.DEFERRED);
  assert.equal(result.story, null);
});

test('NA-15 live pipeline fails closed on organization mismatch', async () => {
  const bundle = baseBundle();
  const mismatch: LiveResearchBundle = {
    ...bundle,
    event: { ...bundle.event, organizationId: 'other-org' as never },
  };
  const result = await pipelineFor(mismatch).process(candidate);
  assert.equal(result.outcome, LiveProcessingOutcome.FAILED);
  assert.ok(result.reasons.includes('LIVE_PIPELINE_EVENT_ORGANIZATION_MISMATCH'));
});

test('NA-15 live pipeline rejects non-HTTPS candidates before research', async () => {
  let calls = 0;
  const pipeline = createLiveNewsProcessingPipeline({
    researchProvider: { async research() { calls += 1; return baseBundle(); } },
    clock: () => now,
    storyIdFactory: () => 'story-1',
  });
  await assert.rejects(() => pipeline.process({ ...candidate, url: 'http://example.com/release' }), /HTTPS_REQUIRED/);
  assert.equal(calls, 0);
});
