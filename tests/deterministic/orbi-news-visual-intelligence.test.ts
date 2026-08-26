import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory } from '../../domain/common/enums';
import {
  CATEGORY_VISUAL_PROFILES,
  ORBI_NEWS_VISUAL_PROFILE,
  VisualAssetOrigin,
  VisualTruthLabel,
  buildAiVisualPromptContract,
  getCategoryVisualProfile,
  validateVisualOriginLabelPair,
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
