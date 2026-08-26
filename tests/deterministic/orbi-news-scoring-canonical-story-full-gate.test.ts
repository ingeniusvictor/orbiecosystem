import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ContentCategory,
  RiskLevel,
  VerificationConfidence,
} from '../../domain/common/enums';
import {
  CanonicalStoryStatus,
  ContentFormat,
  EditorialTone,
  type CanonicalStory,
} from '../../domain/editorial/canonical-story';
import {
  buildCanonicalStory,
  type CanonicalStoryBuilderInput,
} from '../../domain/editorial/canonical-story-builder';
import {
  IntegratedEditorialDecision,
  evaluateIntegratedEditorialGate,
} from '../../domain/editorial/editorial-gate';
import {
  OrbiEditorialBand,
  calculateOrbiEditorialScore,
  evaluateBreakingEligibility,
} from '../../domain/editorial/scoring';
import { EventStatus } from '../../domain/events/event';
import {
  VerificationDecision,
  type VerificationGateResult,
} from '../../domain/verification/verification';

const allowedVerification = (): VerificationGateResult => ({
  decision: VerificationDecision.ALLOW_EDITORIAL_PIPELINE,
  reasons: ['INTEGRATED_VERIFICATION_GATE_PASSED'],
});

const scoreDimensions = () => ({
  strategicRelevance: 96,
  audienceInterest: 94,
  practicalValue: 96,
  novelty: 94,
  timeliness: 96,
  evidenceStrength: 98,
});

const proposal = (): CanonicalStoryBuilderInput['proposal'] => ({
  headline: 'OpenAI confirms a major verified platform update',
  dek: 'ORBI explains what changed, why it matters and what users should understand before acting.',
  slug: 'openai-major-verified-platform-update',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.TECH],
  tone: EditorialTone.EDUCATIONAL,
  format: ContentFormat.NEWS_POST,
  sections: [
    {
      key: 'SUMMARY',
      heading: 'Resumen',
      body: 'La actualización fue confirmada oficialmente.',
      claimKeys: ['announcement'],
      sourceKeys: ['official'],
    },
    {
      key: 'WHAT_HAPPENED',
      heading: 'Qué ocurrió',
      body: 'La fuente primaria confirmó el cambio de la plataforma.',
      claimKeys: ['announcement'],
      sourceKeys: ['official'],
    },
    {
      key: 'WHY_IT_MATTERS',
      heading: 'Por qué importa',
      body: 'El cambio tiene impacto práctico para los usuarios.',
      claimKeys: ['impact'],
      sourceKeys: ['official', 'corroborating'],
    },
    {
      key: 'PRACTICAL_IMPACT',
      heading: 'Impacto práctico',
      body: 'Los usuarios deberían evaluar el cambio antes de incorporarlo a sus flujos.',
      claimKeys: ['impact'],
      sourceKeys: ['official'],
    },
    {
      key: 'ORBI_LENS',
      heading: 'La mirada ORBI',
      body: 'ORBI prioriza la utilidad verificable sobre el entusiasmo inicial.',
      claimKeys: ['impact'],
      sourceKeys: ['official'],
    },
  ],
  sourceKeys: ['official', 'corroborating'],
});

const buildInput = (overrides: Partial<CanonicalStoryBuilderInput> = {}): CanonicalStoryBuilderInput => {
  const score = calculateOrbiEditorialScore(scoreDimensions());
  return {
    id: 'story-na-05-10' as CanonicalStory['id'],
    organizationId: 'org-1' as CanonicalStory['organizationId'],
    eventId: 'event-1' as CanonicalStory['eventId'],
    verificationRecordId: 'verification-1' as CanonicalStory['verificationRecordId'],
    proposal: proposal(),
    verifiedClaims: [
      { key: 'announcement', statement: 'The organization officially confirmed the platform update.' },
      { key: 'impact', statement: 'The update changes practical platform behavior for users.' },
    ],
    verifiedSources: [
      {
        sourceKey: 'official',
        label: 'Official source',
        url: 'https://example.com/official',
        isPrimary: true,
      },
      {
        sourceKey: 'corroborating',
        label: 'Independent corroboration',
        url: 'https://example.com/corroboration',
        isPrimary: false,
      },
    ],
    verificationConfidence: VerificationConfidence.VERY_HIGH,
    riskLevel: RiskLevel.LOW,
    orbiScore: score.total,
    socialScore: 94,
    shortScore: 88,
    createdAt: '2026-08-26T06:30:00Z' as CanonicalStory['createdAt'],
    ...overrides,
  };
};

test('NA-05.10 full gate allows a verified, grounded and publishable canonical story', () => {
  const score = calculateOrbiEditorialScore(scoreDimensions());
  assert.equal(score.band, OrbiEditorialBand.BREAKING_CANDIDATE);

  const story = buildCanonicalStory(buildInput({ orbiScore: score.total }));
  assert.equal(story.status, CanonicalStoryStatus.DRAFT_READY);

  const breaking = evaluateBreakingEligibility({
    orbiScore: score.total,
    socialScore: story.socialScore,
    verificationConfidence: story.verificationConfidence,
    riskLevel: story.riskLevel,
    verificationAllowed: true,
    eventResolved: true,
    hasContradiction: false,
  });
  assert.equal(breaking.eligible, true);

  const gate = evaluateIntegratedEditorialGate({
    story,
    verificationGate: allowedVerification(),
    eventStatus: EventStatus.CONFIRMED,
    hasEventContradiction: false,
    grounding: { valid: true, reasons: [] },
  });

  assert.equal(gate.decision, IntegratedEditorialDecision.ALLOW_EDITORIAL);
  assert.equal(gate.editorialBand, OrbiEditorialBand.BREAKING_CANDIDATE);
});

test('NA-05.10 high editorial value cannot override failed grounding', () => {
  const story = buildCanonicalStory(buildInput());
  assert.ok(story.orbiScore >= 93);

  const gate = evaluateIntegratedEditorialGate({
    story,
    verificationGate: allowedVerification(),
    eventStatus: EventStatus.CONFIRMED,
    hasEventContradiction: false,
    grounding: { valid: false, reasons: ['SEMANTIC_GROUNDING_REVIEW_FAILED'] },
  });

  assert.equal(gate.decision, IntegratedEditorialDecision.BLOCK);
  assert.ok(gate.reasons.includes('CANONICAL_STORY_GROUNDING_INVALID'));
});

test('NA-05.10 a disputed event requires human review and cannot be Breaking', () => {
  const story = buildCanonicalStory(buildInput());

  const breaking = evaluateBreakingEligibility({
    orbiScore: story.orbiScore,
    socialScore: story.socialScore,
    verificationConfidence: story.verificationConfidence,
    riskLevel: story.riskLevel,
    verificationAllowed: true,
    eventResolved: true,
    hasContradiction: true,
  });
  assert.equal(breaking.eligible, false);
  assert.ok(breaking.reasons.includes('EVENT_CONTRADICTION_PRESENT'));

  const gate = evaluateIntegratedEditorialGate({
    story,
    verificationGate: allowedVerification(),
    eventStatus: EventStatus.DISPUTED,
    hasEventContradiction: true,
    grounding: { valid: true, reasons: [] },
  });

  assert.equal(gate.decision, IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW);
});

test('NA-05.10 HOLD score defers even when verification and grounding are valid', () => {
  const story = buildCanonicalStory(buildInput({ orbiScore: 74, socialScore: 94 }));

  const gate = evaluateIntegratedEditorialGate({
    story,
    verificationGate: allowedVerification(),
    eventStatus: EventStatus.CONFIRMED,
    hasEventContradiction: false,
    grounding: { valid: true, reasons: [] },
  });

  assert.equal(gate.editorialBand, OrbiEditorialBand.HOLD);
  assert.equal(gate.decision, IntegratedEditorialDecision.DEFER);
});

test('NA-05.10 verification authority remains above editorial score', () => {
  const story = buildCanonicalStory(buildInput());
  const blockedVerification: VerificationGateResult = {
    decision: VerificationDecision.BLOCK,
    reasons: ['CRITICAL_VERIFICATION_RISK'],
  };

  const gate = evaluateIntegratedEditorialGate({
    story,
    verificationGate: blockedVerification,
    eventStatus: EventStatus.CONFIRMED,
    hasEventContradiction: false,
    grounding: { valid: true, reasons: [] },
  });

  assert.equal(gate.decision, IntegratedEditorialDecision.BLOCK);
  assert.ok(gate.reasons.includes('VERIFICATION_GATE_BLOCKED'));
});
