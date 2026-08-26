import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ContentCategory,
  RiskLevel,
  VerificationConfidence,
} from '../../domain/common/enums';
import { EventStatus } from '../../domain/events/event';
import {
  CanonicalStoryStatus,
  ContentFormat,
  EditorialTone,
  type CanonicalStory,
} from '../../domain/editorial/canonical-story';
import {
  IntegratedEditorialDecision,
  evaluateIntegratedEditorialGate,
} from '../../domain/editorial/editorial-gate';
import { OrbiEditorialBand } from '../../domain/editorial/scoring';
import { VerificationDecision } from '../../domain/verification/verification';

const baseStory = (): CanonicalStory => ({
  id: 'story-1' as CanonicalStory['id'],
  organizationId: 'org-1' as CanonicalStory['organizationId'],
  eventId: 'event-1' as CanonicalStory['eventId'],
  verificationRecordId: 'verification-1' as CanonicalStory['verificationRecordId'],
  status: CanonicalStoryStatus.DRAFT_READY,
  headline: 'Verified ORBI editorial story',
  dek: 'A grounded story ready for the integrated editorial gate.',
  slug: 'verified-orbi-editorial-story',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.TECH],
  tone: EditorialTone.EDUCATIONAL,
  format: ContentFormat.NEWS_POST,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen verificado.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué ocurrió', body: 'Hechos verificados.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Relevancia.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto práctico', body: 'Impacto.' },
    { key: 'ORBI_LENS', heading: 'La mirada ORBI', body: 'Perspectiva educativa.' },
  ],
  sourceRefs: [
    { label: 'Official source', url: 'https://example.com/official', isPrimary: true },
  ],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 90,
  socialScore: 90,
  shortScore: null,
  canonicalImageAssetId: null,
  createdAt: '2026-08-26T06:30:00Z' as CanonicalStory['createdAt'],
  updatedAt: '2026-08-26T06:30:00Z' as CanonicalStory['updatedAt'],
  publishedAt: null,
});

const allowVerification = {
  decision: VerificationDecision.ALLOW_EDITORIAL_PIPELINE,
  reasons: [] as string[],
};

const baseInput = () => ({
  story: baseStory(),
  verificationGate: allowVerification,
  eventStatus: EventStatus.CONFIRMED,
  hasEventContradiction: false,
  grounding: { valid: true, reasons: [] as string[] },
});

test('integrated editorial gate allows a grounded verified publishable story', () => {
  const result = evaluateIntegratedEditorialGate(baseInput());
  assert.equal(result.decision, IntegratedEditorialDecision.ALLOW_EDITORIAL);
  assert.equal(result.editorialBand, OrbiEditorialBand.PRIORITY);
});

test('invalid grounding blocks even a very high scoring story', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    story: { ...input.story, orbiScore: 100 },
    grounding: { valid: false, reasons: ['UNVERIFIED_CLAIM_REFERENCE'] },
  });
  assert.equal(result.decision, IntegratedEditorialDecision.BLOCK);
  assert.ok(result.reasons.includes('CANONICAL_STORY_GROUNDING_INVALID'));
});

test('verification block has precedence over editorial score', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    story: { ...input.story, orbiScore: 100 },
    verificationGate: {
      decision: VerificationDecision.BLOCK,
      reasons: ['CRITICAL_RISK'],
    },
  });
  assert.equal(result.decision, IntegratedEditorialDecision.BLOCK);
  assert.ok(result.reasons.includes('VERIFICATION_GATE_BLOCKED'));
});

test('critical story risk blocks the editorial pipeline', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    story: { ...input.story, riskLevel: RiskLevel.CRITICAL },
  });
  assert.equal(result.decision, IntegratedEditorialDecision.BLOCK);
});

test('ORBI reject band blocks the story', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    story: { ...input.story, orbiScore: 54 },
  });
  assert.equal(result.editorialBand, OrbiEditorialBand.REJECT);
  assert.equal(result.decision, IntegratedEditorialDecision.BLOCK);
});

test('ORBI hold band defers the story', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    story: { ...input.story, orbiScore: 74 },
  });
  assert.equal(result.editorialBand, OrbiEditorialBand.HOLD);
  assert.equal(result.decision, IntegratedEditorialDecision.DEFER);
});

test('verification defer keeps editorial work deferred', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    verificationGate: {
      decision: VerificationDecision.DEFER,
      reasons: ['MORE_RESEARCH_REQUIRED'],
    },
  });
  assert.equal(result.decision, IntegratedEditorialDecision.DEFER);
});

test('event still consolidating defers editorial progression', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    eventStatus: EventStatus.CONSOLIDATING,
  });
  assert.equal(result.decision, IntegratedEditorialDecision.DEFER);
});

test('event contradiction requires human review', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    hasEventContradiction: true,
  });
  assert.equal(result.decision, IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW);
  assert.ok(result.reasons.includes('EVENT_CONTRADICTION_PRESENT'));
});

test('disputed event requires human review', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    eventStatus: EventStatus.DISPUTED,
  });
  assert.equal(result.decision, IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW);
});

test('verification human review propagates to editorial review', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    verificationGate: {
      decision: VerificationDecision.REQUIRE_HUMAN_REVIEW,
      reasons: ['HIGH_RISK_REQUIRES_HUMAN_REVIEW'],
    },
  });
  assert.equal(result.decision, IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW);
});

test('high-risk canonical policy requires human review rather than autonomous allow', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    story: {
      ...input.story,
      riskLevel: RiskLevel.HIGH,
    },
  });
  assert.equal(result.decision, IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW);
});

test('invalid event is blocked', () => {
  const input = baseInput();
  const result = evaluateIntegratedEditorialGate({
    ...input,
    eventStatus: EventStatus.INVALID,
  });
  assert.equal(result.decision, IntegratedEditorialDecision.BLOCK);
  assert.ok(result.reasons.includes('EVENT_INVALID'));
});
