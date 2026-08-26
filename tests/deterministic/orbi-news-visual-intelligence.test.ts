import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory } from '../../domain/common/enums';
import {
  CATEGORY_VISUAL_PROFILES,
  ORBI_NEWS_VISUAL_PROFILE,
  VisualAssetOrigin,
  VisualSafetyDecision,
  VisualSafetySignal,
  VisualTruthLabel,
  buildAiVisualPromptContract,
  evaluateVisualSafetyGate,
  getCategoryVisualProfile,
  validateVisualDimensions16By9,
  validateVisualOriginLabelPair,
  validateVisualOverlay,
} from '../../domain/visuals';

test('ORBI News visual profile is fixed to 16:9 and non-documentary generated visuals', () => {
  assert.equal(ORBI_NEWS_VISUAL_PROFILE.aspectRatio, '16:9');
  assert.ok(
    ORBI_NEWS_VISUAL_PROFILE.mandatoryConstraints.some((value) =>
      value.includes('do not fabricate documentary evidence'),
    ),
  );
});

test('every canonical content category has a visual profile', () => {
  const categories = Object.values(ContentCategory);
  assert.equal(Object.keys(CATEGORY_VISUAL_PROFILES).length, categories.length);
  for (const category of categories) {
    const profile = getCategoryVisualProfile(category);
    assert.equal(profile.category, category);
    assert.ok(profile.subjectDirection.length > 0);
    assert.ok(profile.compositionHint.length > 0);
  }
});

test('AI-generated asset cannot be labeled documentary evidence', () => {
  const errors = validateVisualOriginLabelPair(
    VisualAssetOrigin.AI_GENERATED,
    VisualTruthLabel.DOCUMENTARY_EVIDENCE,
  );
  assert.ok(errors.includes('AI_GENERATED_VISUAL_CANNOT_BE_DOCUMENTARY_EVIDENCE'));
  assert.ok(errors.includes('DOCUMENTARY_EVIDENCE_REQUIRES_VERIFIED_DOCUMENTARY_ORIGIN'));
});

test('documentary evidence requires verified documentary origin', () => {
  assert.deepEqual(
    validateVisualOriginLabelPair(
      VisualAssetOrigin.VERIFIED_DOCUMENTARY,
      VisualTruthLabel.DOCUMENTARY_EVIDENCE,
    ),
    [],
  );
});

test('AI visual prompt contract is deterministic, 16:9 and explicitly illustrative', () => {
  const request = {
    category: ContentCategory.AI,
    subject: 'new artificial intelligence model architecture',
    editorialContext: 'explain a verified model release and its practical significance',
    truthLabel: VisualTruthLabel.TECH_VISUALIZATION,
    overlayText: 'Nueva arquitectura de inteligencia artificial',
    factualEntityNames: ['OpenAI', 'OpenAI'],
  } as const;

  const first = buildAiVisualPromptContract(request);
  const second = buildAiVisualPromptContract(request);

  assert.deepEqual(first, second);
  assert.equal(first.aspectRatio, '16:9');
  assert.equal(first.truthLabel, VisualTruthLabel.TECH_VISUALIZATION);
  assert.ok(first.prompt.includes('not documentary evidence'));
  assert.ok(first.prompt.includes('OpenAI'));
  assert.equal(first.overlayText, 'Nueva arquitectura de inteligencia artificial');
});

test('overlay must contain between 3 and 7 words', () => {
  const base = {
    category: ContentCategory.TECH,
    subject: 'verified technology event',
    editorialContext: 'explain what changed',
    truthLabel: VisualTruthLabel.EDITORIAL_CONCEPT,
    factualEntityNames: [],
  } as const;

  assert.throws(
    () => buildAiVisualPromptContract({ ...base, overlayText: 'Dos palabras' }),
    RangeError,
  );
  assert.throws(
    () =>
      buildAiVisualPromptContract({
        ...base,
        overlayText: 'Uno dos tres cuatro cinco seis siete ocho',
      }),
    RangeError,
  );

  assert.doesNotThrow(() =>
    buildAiVisualPromptContract({ ...base, overlayText: 'Tres palabras exactas' }),
  );
  assert.doesNotThrow(() =>
    buildAiVisualPromptContract({
      ...base,
      overlayText: 'Uno dos tres cuatro cinco seis siete',
    }),
  );
});

test('AI prompt builder rejects documentary evidence truth label', () => {
  assert.throws(
    () =>
      buildAiVisualPromptContract({
        category: ContentCategory.SCIENCE,
        subject: 'laboratory research result',
        editorialContext: 'verified research announcement',
        truthLabel: VisualTruthLabel.DOCUMENTARY_EVIDENCE,
        overlayText: 'Nuevo resultado científico verificado',
        factualEntityNames: [],
      }),
    RangeError,
  );
});

test('future-tech profile explicitly prevents generated concepts being treated as deployed systems', () => {
  const profile = getCategoryVisualProfile(ContentCategory.FUTURE_TECH);
  assert.ok(profile.compositionHint.includes('cannot be mistaken for a deployed real system'));
});

test('overlay output validation normalizes text and enforces editorial limits', () => {
  const valid = validateVisualOverlay('  Nueva   arquitectura de IA  ');
  assert.equal(valid.valid, true);
  assert.equal(valid.normalizedText, 'Nueva arquitectura de IA');
  assert.equal(valid.wordCount, 4);

  assert.equal(validateVisualOverlay('Dos palabras').valid, false);
  assert.ok(
    validateVisualOverlay('Uno dos tres cuatro cinco seis siete ocho').reasons.includes(
      'VISUAL_OVERLAY_WORD_COUNT_OUT_OF_RANGE',
    ),
  );
  assert.ok(
    validateVisualOverlay('Mira esta noticia en https://example.com ahora').reasons.includes(
      'VISUAL_OVERLAY_URL_NOT_ALLOWED',
    ),
  );
  assert.ok(
    validateVisualOverlay('Nueva noticia\npara ORBI').reasons.includes(
      'VISUAL_OVERLAY_LINE_BREAK_NOT_ALLOWED',
    ),
  );
});

test('visual dimensions require exact 16:9 output', () => {
  assert.equal(validateVisualDimensions16By9({ width: 1920, height: 1080 }).valid, true);
  assert.equal(validateVisualDimensions16By9({ width: 1280, height: 720 }).valid, true);
  assert.equal(validateVisualDimensions16By9({ width: 1024, height: 1024 }).valid, false);
  assert.equal(validateVisualDimensions16By9({ width: 1919, height: 1080 }).valid, false);
  assert.equal(validateVisualDimensions16By9({ width: 0, height: 1080 }).valid, false);
});

test('safe generated visual can pass the visual safety gate', () => {
  const result = evaluateVisualSafetyGate({
    origin: VisualAssetOrigin.AI_GENERATED,
    truthLabel: VisualTruthLabel.EDITORIAL_CONCEPT,
    dimensions: { width: 1920, height: 1080 },
    overlayText: 'Nueva era para la IA',
    signals: [],
  });

  assert.equal(result.decision, VisualSafetyDecision.ALLOW);
});

test('non-16:9 output is blocked even if everything else is safe', () => {
  const result = evaluateVisualSafetyGate({
    origin: VisualAssetOrigin.AI_GENERATED,
    truthLabel: VisualTruthLabel.TECH_VISUALIZATION,
    dimensions: { width: 1024, height: 1024 },
    overlayText: 'Nueva arquitectura para modelos IA',
    signals: [],
  });

  assert.equal(result.decision, VisualSafetyDecision.BLOCK);
  assert.ok(result.reasons.includes('VISUAL_ASPECT_RATIO_MUST_BE_16_9'));
});

test('fabricated documentary scene blocks generated visual', () => {
  const result = evaluateVisualSafetyGate({
    origin: VisualAssetOrigin.AI_GENERATED,
    truthLabel: VisualTruthLabel.ILLUSTRATIVE_RENDER,
    dimensions: { width: 1920, height: 1080 },
    overlayText: 'Nuevo centro tecnológico anunciado hoy',
    signals: [VisualSafetySignal.FABRICATED_DOCUMENTARY_SCENE],
  });

  assert.equal(result.decision, VisualSafetyDecision.BLOCK);
  assert.ok(
    result.reasons.includes(
      'VISUAL_SAFETY_BLOCK:FABRICATED_DOCUMENTARY_SCENE',
    ),
  );
});

test('unsupported quote or statistic blocks visual regardless of valid dimensions', () => {
  const result = evaluateVisualSafetyGate({
    origin: VisualAssetOrigin.AI_GENERATED,
    truthLabel: VisualTruthLabel.EDITORIAL_CONCEPT,
    dimensions: { width: 1280, height: 720 },
    overlayText: 'Nueva tecnología cambia el mercado',
    signals: [VisualSafetySignal.UNSUPPORTED_QUOTE_OR_STATISTIC],
  });

  assert.equal(result.decision, VisualSafetyDecision.BLOCK);
});

test('unverified real-person depiction requires human review', () => {
  const result = evaluateVisualSafetyGate({
    origin: VisualAssetOrigin.AI_GENERATED,
    truthLabel: VisualTruthLabel.EDITORIAL_CONCEPT,
    dimensions: { width: 1920, height: 1080 },
    overlayText: 'Nuevo anuncio cambia la industria',
    signals: [VisualSafetySignal.UNVERIFIED_REAL_PERSON_DEPICTION],
  });

  assert.equal(result.decision, VisualSafetyDecision.REQUIRE_HUMAN_REVIEW);
  assert.ok(
    result.reasons.includes(
      'VISUAL_SAFETY_REVIEW:UNVERIFIED_REAL_PERSON_DEPICTION',
    ),
  );
});

test('invalid AI documentary labeling blocks before review-only signals can matter', () => {
  const result = evaluateVisualSafetyGate({
    origin: VisualAssetOrigin.AI_GENERATED,
    truthLabel: VisualTruthLabel.DOCUMENTARY_EVIDENCE,
    dimensions: { width: 1920, height: 1080 },
    overlayText: 'Nuevo anuncio cambia la industria',
    signals: [VisualSafetySignal.UNSUPPORTED_BRAND_OR_LOGO],
  });

  assert.equal(result.decision, VisualSafetyDecision.BLOCK);
  assert.ok(result.reasons.includes('AI_GENERATED_VISUAL_CANNOT_BE_DOCUMENTARY_EVIDENCE'));
});
