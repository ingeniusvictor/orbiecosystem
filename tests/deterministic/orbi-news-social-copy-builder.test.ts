import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type { IsoUtcDateTime, SocialPackageId } from '../../domain/common/types';
import {
  CanonicalStoryStatus,
  ContentFormat,
  EditorialTone,
  type CanonicalStory,
} from '../../domain/editorial/canonical-story';
import {
  assembleSocialCopy,
  buildSocialPackageDraft,
} from '../../domain/editorial/social-copy-builder';
import { countSocialCopyCharacters } from '../../domain/editorial/social-length-policy';
import {
  SOCIAL_PACKAGE_REQUIRED_SECTIONS,
  SOCIAL_PACKAGE_V1_PLATFORMS,
  SocialContentSection,
  SocialPackageStatus,
} from '../../domain/editorial/social-package';

const publishedStory = (): CanonicalStory => ({
  id: 'story-social-builder' as CanonicalStory['id'],
  organizationId: 'org-orbi' as CanonicalStory['organizationId'],
  eventId: 'event-social-builder' as CanonicalStory['eventId'],
  verificationRecordId: 'verification-social-builder' as CanonicalStory['verificationRecordId'],
  status: CanonicalStoryStatus.PUBLISHED,
  headline: 'ORBI confirma un nuevo avance tecnológico',
  dek: 'Una historia publicada para probar el builder social.',
  slug: 'orbi-confirma-nuevo-avance-tecnologico',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.TECH],
  tone: EditorialTone.INFORMATIVE,
  format: ContentFormat.NEWS_POST,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen verificado.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué pasó', body: 'La organización anunció una nueva capacidad verificada.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'El cambio puede reducir barreras para adoptar esta tecnología.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto práctico', body: 'Equipos técnicos podrán evaluar nuevas aplicaciones con menor fricción.' },
    { key: 'ORBI_LENS', heading: 'Mirada ORBI', body: 'ORBI prioriza entender el impacto práctico antes que el ruido promocional.' },
    { key: 'FUTURE_OUTLOOK', heading: 'Qué sigue', body: 'El mercado seguirá evolucionando.' },
  ],
  sourceRefs: [{ label: 'Fuente oficial', url: 'https://example.com/source', isPrimary: true }],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 91,
  socialScore: 88,
  shortScore: 80,
  canonicalImageAssetId: null,
  createdAt: '2026-08-26T19:50:00.000Z' as CanonicalStory['createdAt'],
  updatedAt: '2026-08-26T19:51:00.000Z' as CanonicalStory['updatedAt'],
  publishedAt: '2026-08-26T19:52:00.000Z' as CanonicalStory['publishedAt'],
});

const build = (story: CanonicalStory = publishedStory()) =>
  buildSocialPackageDraft({
    id: 'social-package-builder-1' as SocialPackageId,
    story,
    storyRevision: 'story-rev-9',
    webArticleUrl: 'https://orbi.example/news/orbi-confirma-nuevo-avance-tecnologico',
    ctaText: 'Lee el análisis completo en ORBI News.',
    createdAt: '2026-08-26T19:55:00.000Z' as IsoUtcDateTime,
  });

test('builder transforms published canonical story into a DRAFT social package', () => {
  const result = build();

  assert.equal(result.status, SocialPackageStatus.DRAFT);
  assert.equal(result.organizationId, 'org-orbi');
  assert.equal(result.canonicalStoryId, 'story-social-builder');
  assert.deepEqual(result.targetPlatforms, SOCIAL_PACKAGE_V1_PLATFORMS);
  assert.deepEqual(result.hashtags, []);
  assert.equal(result.imageAssetId, null);
  assert.equal(result.imageAspectRatio, '16:9');
});

test('builder emits the six canonical social sections in the exact required order', () => {
  const result = build();

  assert.deepEqual(
    result.sections.map((section) => section.section),
    SOCIAL_PACKAGE_REQUIRED_SECTIONS,
  );
  assert.equal(result.sections[0]?.section, SocialContentSection.HOOK);
  assert.equal(result.sections[0]?.text, publishedStory().headline);
  assert.equal(result.sections[1]?.text, publishedStory().sections.find((section) => section.key === 'WHAT_HAPPENED')?.body);
  assert.equal(result.sections[2]?.text, publishedStory().sections.find((section) => section.key === 'WHY_IT_MATTERS')?.body);
  assert.equal(result.sections[3]?.text, publishedStory().sections.find((section) => section.key === 'PRACTICAL_IMPACT')?.body);
  assert.equal(result.sections[4]?.text, publishedStory().sections.find((section) => section.key === 'ORBI_LENS')?.body);
  assert.equal(result.sections[5]?.text, 'Lee el análisis completo en ORBI News.');
});

test('builder excludes SUMMARY and FUTURE_OUTLOOK from the final social copy', () => {
  const result = build();

  assert.equal(result.copy.includes('Resumen verificado.'), false);
  assert.equal(result.copy.includes('El mercado seguirá evolucionando.'), false);
});

test('copy assembly is deterministic and separated by exactly one blank line', () => {
  const result = build();
  const expected = result.sections.map((section) => section.text).join('\n\n');

  assert.equal(result.copy, expected);
  assert.equal(assembleSocialCopy(result.sections), expected);
});

test('characterCount is recomputed from final copy and is not caller supplied', () => {
  const result = build();

  assert.equal(result.characterCount, countSocialCopyCharacters(result.copy));
});

test('builder records story revision and public URL provenance', () => {
  const result = build();

  assert.deepEqual(result.provenance, {
    canonicalStoryId: result.canonicalStoryId,
    canonicalStoryRevision: 'story-rev-9',
    webArticleUrl: 'https://orbi.example/news/orbi-confirma-nuevo-avance-tecnologico',
  });
  assert.equal(result.webArticleUrl, result.provenance?.webArticleUrl);
});

test('builder rejects a canonical story that is not published', () => {
  const story = { ...publishedStory(), status: CanonicalStoryStatus.APPROVED, publishedAt: null };

  assert.throws(() => build(story), /must be PUBLISHED/);
});

test('builder rejects missing required canonical story sections', () => {
  const story = {
    ...publishedStory(),
    sections: publishedStory().sections.filter((section) => section.key !== 'ORBI_LENS'),
  };

  assert.throws(() => build(story), /ORBI_LENS is required for social copy/);
});

test('builder rejects empty CTA because CTA policy must supply explicit text', () => {
  assert.throws(
    () =>
      buildSocialPackageDraft({
        id: 'social-package-builder-empty-cta' as SocialPackageId,
        story: publishedStory(),
        storyRevision: 'story-rev-9',
        webArticleUrl: 'https://orbi.example/news/story',
        ctaText: '   ',
        createdAt: '2026-08-26T19:55:00.000Z' as IsoUtcDateTime,
      }),
    /Social CTA is required/,
  );
});

test('builder rejects invalid or non-http public article URL', () => {
  for (const webArticleUrl of ['not-a-url', 'ftp://orbi.example/news/story']) {
    assert.throws(
      () =>
        buildSocialPackageDraft({
          id: 'social-package-builder-url' as SocialPackageId,
          story: publishedStory(),
          storyRevision: 'story-rev-9',
          webArticleUrl,
          ctaText: 'Lee más en ORBI News.',
          createdAt: '2026-08-26T19:55:00.000Z' as IsoUtcDateTime,
        }),
      /absolute HTTP\(S\) URL/,
    );
  }
});

test('builder never marks content READY even when story scores are high', () => {
  const story = { ...publishedStory(), orbiScore: 100, socialScore: 100 };
  const result = build(story);

  assert.equal(result.status, SocialPackageStatus.DRAFT);
});
