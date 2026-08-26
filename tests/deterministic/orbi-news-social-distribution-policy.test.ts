import assert from 'node:assert/strict';
import test from 'node:test';
import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type {
  CanonicalStoryId,
  EventId,
  IsoUtcDateTime,
  OrganizationId,
  SocialPackageId,
  VerificationRecordId,
} from '../../domain/common/types';
import {
  CanonicalStoryStatus,
  ContentFormat,
  EditorialTone,
  type CanonicalStory,
} from '../../domain/editorial/canonical-story';
import { buildSocialPackageDraft } from '../../domain/editorial/social-copy-builder';
import {
  SOCIAL_HASHTAG_MAX,
  applySocialDistributionPolicy,
  assembleSocialCopyWithHashtags,
  selectSocialCta,
  selectSocialHashtags,
} from '../../domain/editorial/social-distribution-policy';
import { countSocialCopyCharacters } from '../../domain/editorial/social-length-policy';
import { SocialContentSection, SocialPackageStatus } from '../../domain/editorial/social-package';

const asId = <T>(value: string): T => value as T;
const now = '2026-08-26T20:00:00.000Z' as IsoUtcDateTime;

const makeStory = (overrides: Partial<CanonicalStory> = {}): CanonicalStory => ({
  id: asId<CanonicalStoryId>('story-social-policy'),
  organizationId: asId<OrganizationId>('org-orbi'),
  eventId: asId<EventId>('event-social-policy'),
  verificationRecordId: asId<VerificationRecordId>('verification-social-policy'),
  status: CanonicalStoryStatus.PUBLISHED,
  headline: 'Nueva plataforma de inteligencia artificial mejora la automatización',
  dek: 'Una actualización verificada con impacto práctico para equipos tecnológicos.',
  slug: 'nueva-plataforma-inteligencia-artificial',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.AUTOMATION, ContentCategory.TECH],
  tone: EditorialTone.INFORMATIVE,
  format: ContentFormat.NEWS_POST,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen verificado.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué ocurrió', body: 'La plataforma presentó nuevas capacidades verificadas.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Reduce barreras para automatizar procesos tecnológicos.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto práctico', body: 'Los equipos pueden evaluar nuevos flujos de automatización.' },
    { key: 'ORBI_LENS', heading: 'Mirada ORBI', body: 'La utilidad real depende de aplicar la tecnología con objetivos concretos.' },
  ],
  sourceRefs: [{ label: 'Fuente oficial', url: 'https://example.com/source', isPrimary: true }],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 92,
  socialScore: 91,
  shortScore: null,
  canonicalImageAssetId: null,
  createdAt: now,
  updatedAt: now,
  publishedAt: now,
  ...overrides,
});

const makeDraft = (story = makeStory()) =>
  buildSocialPackageDraft({
    id: asId<SocialPackageId>('social-package-policy'),
    story,
    storyRevision: 'rev-1',
    webArticleUrl: 'https://orbi.example/news/nueva-plataforma-inteligencia-artificial',
    ctaText: 'CTA temporal del builder.',
    createdAt: now,
  });

test('selectSocialCta uses deterministic copy by content format', () => {
  assert.match(selectSocialCta(makeStory({ format: ContentFormat.NEWS_POST })), /Lee la nota completa/);
  assert.match(selectSocialCta(makeStory({ format: ContentFormat.BREAKING_NEWS })), /Sigue la cobertura completa/);
  assert.match(selectSocialCta(makeStory({ format: ContentFormat.EXPLAINER })), /Lee la explicación completa/);
  assert.match(selectSocialCta(makeStory({ format: ContentFormat.ANALYSIS })), /Revisa el análisis completo/);
  assert.match(selectSocialCta(makeStory({ format: ContentFormat.EVENT_UPDATE })), /Revisa la actualización completa/);
  assert.match(selectSocialCta(makeStory({ format: ContentFormat.SHORT_SCRIPT })), /Conoce el contexto completo/);
});

test('selectSocialHashtags uses brand tags plus allowlisted categories with bounded count', () => {
  const hashtags = selectSocialHashtags(makeStory());
  assert.deepEqual(hashtags, [
    '#ORBIEcosystem',
    '#ORBINews',
    '#InteligenciaArtificial',
    '#IA',
    '#Automatizacion',
    '#Tecnologia',
  ]);
  assert.equal(hashtags.length, SOCIAL_HASHTAG_MAX);
  assert.equal(new Set(hashtags.map((tag) => tag.toLowerCase())).size, hashtags.length);
});

test('selectSocialHashtags deduplicates repeated category tags deterministically', () => {
  const story = makeStory({
    primaryCategory: ContentCategory.AI,
    secondaryCategories: [ContentCategory.AI, ContentCategory.AUTOMATION, ContentCategory.AI],
  });
  const hashtags = selectSocialHashtags(story);
  assert.deepEqual(hashtags, ['#ORBIEcosystem', '#ORBINews', '#InteligenciaArtificial', '#IA', '#Automatizacion']);
});

test('applySocialDistributionPolicy replaces CTA, appends hashtags and recomputes character count', () => {
  const story = makeStory();
  const draft = makeDraft(story);
  const result = applySocialDistributionPolicy(story, draft);

  assert.equal(result.status, SocialPackageStatus.DRAFT);
  const cta = result.sections.find((section) => section.section === SocialContentSection.CTA);
  assert.equal(cta?.text, selectSocialCta(story));
  assert.deepEqual(result.hashtags, selectSocialHashtags(story));
  assert.ok(result.copy.endsWith(result.hashtags.join(' ')));
  assert.equal(result.characterCount, countSocialCopyCharacters(result.copy));
  assert.notEqual(result.copy, draft.copy);
});

test('assembleSocialCopyWithHashtags adds exactly one blank line before hashtag block', () => {
  const sections = [
    { section: SocialContentSection.HOOK, text: 'Hook' },
    { section: SocialContentSection.CTA, text: 'CTA' },
  ];
  assert.equal(
    assembleSocialCopyWithHashtags(sections, ['#Uno', '#Dos']),
    'Hook\n\nCTA\n\n#Uno #Dos',
  );
});

test('distribution policy rejects cross-story, cross-organization and non-draft packages', () => {
  const story = makeStory();
  const draft = makeDraft(story);

  assert.throws(
    () => applySocialDistributionPolicy(makeStory({ id: asId<CanonicalStoryId>('story-other') }), draft),
    /SOCIAL_PACKAGE_STORY_MISMATCH/,
  );
  assert.throws(
    () => applySocialDistributionPolicy(makeStory({ organizationId: asId<OrganizationId>('org-other') }), draft),
    /SOCIAL_PACKAGE_ORGANIZATION_MISMATCH/,
  );
  assert.throws(
    () => applySocialDistributionPolicy(story, { ...draft, status: SocialPackageStatus.READY }),
    /SOCIAL_DISTRIBUTION_POLICY_REQUIRES_DRAFT/,
  );
});

test('distribution policy never upgrades readiness', () => {
  const story = makeStory({ orbiScore: 100, socialScore: 100 });
  const result = applySocialDistributionPolicy(story, makeDraft(story));
  assert.equal(result.status, SocialPackageStatus.DRAFT);
});
