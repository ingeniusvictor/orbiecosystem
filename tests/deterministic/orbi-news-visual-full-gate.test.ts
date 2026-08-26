import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type { CanonicalStory } from '../../domain/editorial/canonical-story';
import {
  CanonicalStoryStatus,
  ContentFormat,
  EditorialTone,
} from '../../domain/editorial/canonical-story';
import {
  FullVisualDecision,
  VisualSafetySignal,
  VisualTruthLabel,
  evaluateFullVisualGate,
  failedVisualGeneration,
  normalizeSuccessfulVisualGeneration,
  visualGenerationNotConfigured,
} from '../../domain/visuals';

const story = (): CanonicalStory => ({
  id: 'story-visual-1' as CanonicalStory['id'],
  organizationId: 'org-1' as CanonicalStory['organizationId'],
  eventId: 'event-1' as CanonicalStory['eventId'],
  verificationRecordId: 'verification-1' as CanonicalStory['verificationRecordId'],
  status: CanonicalStoryStatus.DRAFT_READY,
  headline: 'ORBI explains a verified AI platform update',
  dek: 'A grounded editorial story prepared for visual treatment.',
  slug: 'orbi-verified-ai-platform-update',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.TECH],
  tone: EditorialTone.EDUCATIONAL,
  format: ContentFormat.NEWS_POST,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen verificado.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué ocurrió', body: 'Hechos verificados.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Importancia.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto práctico', body: 'Impacto.' },
    { key: 'ORBI_LENS', heading: 'La mirada ORBI', body: 'Perspectiva ORBI.' },
  ],
  sourceRefs: [{ label: 'Primary', url: 'https://example.com/source', isPrimary: true }],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 92,
  socialScore: 91,
  shortScore: 84,
  canonicalImageAssetId: null,
  createdAt: '2026-08-26T06:30:00Z' as CanonicalStory['createdAt'],
  updatedAt: '2026-08-26T06:30:00Z' as CanonicalStory['updatedAt'],
  publishedAt: null,
});

const baseInput = () => ({
  story: story(),
  subject: 'verified artificial intelligence platform update',
  editorialContext: 'show the practical meaning of a verified AI platform update',
  truthLabel: VisualTruthLabel.TECH_VISUALIZATION,
  overlayText: 'Nueva actualización de inteligencia artificial',
  factualEntityNames: ['OpenAI'],
});

test('full visual gate allows a clean successful 16:9 generated result', () => {
  const result = evaluateFullVisualGate({
    ...baseInput(),
    generationResult: normalizeSuccessfulVisualGeneration({
      providerKey: 'provider-a',
      modelKey: 'model-a',
      requestId: 'request-1',
      assetUrl: 'https://assets.example.com/orbi-visual.webp',
      width: 1920,
      height: 1080,
      mimeType: 'image/webp',
      generatedAt: '2026-08-26T06:31:00Z' as CanonicalStory['createdAt'],
    }),
  });

  assert.equal(result.decision, FullVisualDecision.ALLOW);
  assert.equal(result.promptContract.aspectRatio, '16:9');
  assert.equal(result.safety?.decision, 'ALLOW');
});

test('full visual gate defers when image generation is not configured', () => {
  const result = evaluateFullVisualGate({
    ...baseInput(),
    generationResult: visualGenerationNotConfigured(),
  });

  assert.equal(result.decision, FullVisualDecision.DEFER);
  assert.ok(result.reasons.includes('IMAGE_GENERATION_NOT_CONFIGURED'));
});

test('full visual gate defers provider generation failure without pretending an asset exists', () => {
  const result = evaluateFullVisualGate({
    ...baseInput(),
    generationResult: failedVisualGeneration('provider-a', 'PROVIDER_TIMEOUT'),
  });

  assert.equal(result.decision, FullVisualDecision.DEFER);
  assert.ok(result.reasons.includes('VISUAL_GENERATION_FAILED'));
  assert.ok(result.reasons.includes('PROVIDER_TIMEOUT'));
});

test('full visual gate blocks a successful provider result with non-16:9 dimensions', () => {
  const result = evaluateFullVisualGate({
    ...baseInput(),
    generationResult: normalizeSuccessfulVisualGeneration({
      providerKey: 'provider-a',
      assetUrl: 'https://assets.example.com/square.webp',
      width: 1024,
      height: 1024,
      mimeType: 'image/webp',
      generatedAt: '2026-08-26T06:31:00Z' as CanonicalStory['createdAt'],
    }),
  });

  assert.equal(result.decision, FullVisualDecision.BLOCK);
  assert.ok(result.reasons.includes('VISUAL_ASPECT_RATIO_MUST_BE_16_9'));
});

test('full visual gate blocks fabricated documentary scene signal', () => {
  const result = evaluateFullVisualGate({
    ...baseInput(),
    generationResult: normalizeSuccessfulVisualGeneration({
      providerKey: 'provider-a',
      assetUrl: 'https://assets.example.com/misleading.webp',
      width: 1920,
      height: 1080,
      mimeType: 'image/webp',
      safetySignals: [VisualSafetySignal.FABRICATED_DOCUMENTARY_SCENE],
      generatedAt: '2026-08-26T06:31:00Z' as CanonicalStory['createdAt'],
    }),
  });

  assert.equal(result.decision, FullVisualDecision.BLOCK);
  assert.ok(
    result.reasons.includes(
      'VISUAL_SAFETY_BLOCK:FABRICATED_DOCUMENTARY_SCENE',
    ),
  );
});

test('full visual gate requires human review for ambiguous real-person depiction', () => {
  const result = evaluateFullVisualGate({
    ...baseInput(),
    generationResult: normalizeSuccessfulVisualGeneration({
      providerKey: 'provider-a',
      assetUrl: 'https://assets.example.com/person.webp',
      width: 1920,
      height: 1080,
      mimeType: 'image/webp',
      safetySignals: [VisualSafetySignal.UNVERIFIED_REAL_PERSON_DEPICTION],
      generatedAt: '2026-08-26T06:31:00Z' as CanonicalStory['createdAt'],
    }),
  });

  assert.equal(result.decision, FullVisualDecision.REQUIRE_HUMAN_REVIEW);
  assert.ok(
    result.reasons.includes(
      'VISUAL_SAFETY_REVIEW:UNVERIFIED_REAL_PERSON_DEPICTION',
    ),
  );
});

test('successful generation result deduplicates safety signals deterministically', () => {
  const result = normalizeSuccessfulVisualGeneration({
    providerKey: 'provider-a',
    assetUrl: 'https://assets.example.com/asset.webp',
    width: 1920,
    height: 1080,
    mimeType: 'image/webp',
    safetySignals: [
      VisualSafetySignal.UNSUPPORTED_BRAND_OR_LOGO,
      VisualSafetySignal.UNSUPPORTED_BRAND_OR_LOGO,
    ],
    generatedAt: '2026-08-26T06:31:00Z' as CanonicalStory['createdAt'],
  });

  assert.deepEqual(result.safetySignals, [VisualSafetySignal.UNSUPPORTED_BRAND_OR_LOGO]);
});
