import assert from 'node:assert/strict';
import test from 'node:test';
import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type { CanonicalStoryId, EventId, IsoUtcDateTime, OrganizationId, SocialPackageId, VerificationRecordId } from '../../domain/common/types';
import { CanonicalStoryStatus, ContentFormat, EditorialTone, type CanonicalStory } from '../../domain/editorial/canonical-story';
import { generateSocialEmailPackage } from '../../domain/editorial/social-email-package';
import { SocialEmailStatus, type SocialMailerJob, type SocialMailerJobId } from '../../domain/editorial/social-mailer';
import { SocialPackageStatus, type SocialPackage } from '../../domain/editorial/social-package';
import { VisualAssetOrigin, VisualAssetStatus, VisualTruthLabel, type VisualAsset, type VisualAssetId } from '../../domain/visuals/visual-asset';

const asId = <T>(value: string): T => value as T;
const now = '2026-08-26T20:30:00.000Z' as IsoUtcDateTime;

const story: CanonicalStory = {
  id: asId<CanonicalStoryId>('story-email'),
  organizationId: asId<OrganizationId>('org-orbi'),
  eventId: asId<EventId>('event-email'),
  verificationRecordId: asId<VerificationRecordId>('verification-email'),
  status: CanonicalStoryStatus.PUBLISHED,
  headline: 'ORBI News prueba paquete social',
  dek: 'Historia verificada para distribución social.',
  slug: 'orbi-news-prueba-paquete-social',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.TECH],
  tone: EditorialTone.INFORMATIVE,
  format: ContentFormat.NEWS_POST,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué pasó', body: 'Pasó algo verificado.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Tiene impacto práctico.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto', body: 'Puede aplicarse.' },
    { key: 'ORBI_LENS', heading: 'ORBI', body: 'ORBI lo contextualiza.' },
  ],
  sourceRefs: [
    { label: 'Fuente oficial', url: 'https://example.com/source', isPrimary: true },
    { label: 'Fuente secundaria', url: 'https://example.com/context', isPrimary: false },
  ],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 94,
  socialScore: 92,
  shortScore: null,
  canonicalImageAssetId: asId<VisualAssetId>('visual-email'),
  createdAt: now,
  updatedAt: now,
  publishedAt: now,
};

const socialPackage: SocialPackage = {
  id: asId<SocialPackageId>('social-email'),
  organizationId: story.organizationId,
  canonicalStoryId: story.id,
  status: SocialPackageStatus.READY,
  targetPlatforms: [],
  socialHeadline: story.headline,
  sections: [],
  copy: 'Copy social listo',
  hashtags: ['#ORBIEcosystem', '#ORBINews'],
  characterCount: [...'Copy social listo'].length,
  imageAspectRatio: '16:9',
  imageAssetId: asId<VisualAssetId>('visual-email'),
  webArticleUrl: 'https://orbi.example/news/orbi-news-prueba-paquete-social',
  provenance: {
    canonicalStoryId: story.id,
    canonicalStoryRevision: 'story-rev-7',
    webArticleUrl: 'https://orbi.example/news/orbi-news-prueba-paquete-social',
  },
  createdAt: now,
  updatedAt: now,
};

const visualAsset: VisualAsset = {
  id: asId<VisualAssetId>('visual-email'),
  organizationId: story.organizationId,
  canonicalStoryId: story.id,
  status: VisualAssetStatus.VALIDATED,
  origin: VisualAssetOrigin.AI_GENERATED,
  truthLabel: VisualTruthLabel.EDITORIAL_CONCEPT,
  category: ContentCategory.AI,
  aspectRatio: '16:9',
  width: 1600,
  height: 900,
  assetUrl: 'https://cdn.example.com/orbi-social.jpg',
  overlayText: null,
  createdAt: now,
  updatedAt: now,
};

const mailerJob: SocialMailerJob = {
  id: asId<SocialMailerJobId>('mailer-email'),
  organizationId: story.organizationId,
  canonicalStoryId: story.id,
  socialPackageId: socialPackage.id,
  status: SocialEmailStatus.NOT_CREATED,
  subject: `ORBI News Ready — ${story.headline}`,
  recipient: 'victor@example.com',
  provenance: {
    canonicalStoryId: story.id,
    socialPackageId: socialPackage.id,
    canonicalStoryRevision: 'story-rev-7',
    socialPackageRevision: 'social-rev-4',
  },
  createdAt: now,
  updatedAt: now,
  sentAt: null,
  failureReason: null,
};

const generate = (overrides: Partial<Parameters<typeof generateSocialEmailPackage>[0]> = {}) =>
  generateSocialEmailPackage({
    story,
    storyRevision: 'story-rev-7',
    socialPackage,
    socialPackageRevision: 'social-rev-4',
    visualAsset,
    mailerJob,
    ...overrides,
  });

test('generates deterministic public and private email payload without sending', () => {
  const result = generate();
  assert.equal(result.subject, mailerJob.subject);
  assert.equal(result.recipient, mailerJob.recipient);
  assert.equal(result.publicPackage.publishedStatus, CanonicalStoryStatus.PUBLISHED);
  assert.equal(result.publicPackage.orbiScore, story.orbiScore);
  assert.equal(result.publicPackage.category, story.primaryCategory);
  assert.equal(result.publicPackage.socialCopy, socialPackage.copy);
  assert.deepEqual(result.publicPackage.hashtags, socialPackage.hashtags);
  assert.equal(result.publicPackage.imageUrl, 'https://cdn.example.com/orbi-social.jpg');
  assert.equal(result.publicPackage.articleUrl, 'https://orbi.example/news/orbi-news-prueba-paquete-social');
  assert.equal(result.privateVerification.verificationConfidence, VerificationConfidence.VERY_HIGH);
  assert.equal(result.privateVerification.riskLevel, RiskLevel.LOW);
  assert.deepEqual(result.privateVerification.sources, story.sourceRefs);
  assert.equal(mailerJob.status, SocialEmailStatus.NOT_CREATED);
  assert.equal(socialPackage.status, SocialPackageStatus.READY);
});

test('allows payload generation while mailer is GENERATING but not READY/SENDING/SENT', () => {
  assert.doesNotThrow(() => generate({ mailerJob: { ...mailerJob, status: SocialEmailStatus.GENERATING } }));
  for (const status of [SocialEmailStatus.READY, SocialEmailStatus.SENDING, SocialEmailStatus.SENT]) {
    assert.throws(() => generate({ mailerJob: { ...mailerJob, status } }), /SOCIAL_EMAIL_PACKAGE_MAILER_STATUS_INVALID/);
  }
});

test('rejects stale provenance and mismatched visual binding', () => {
  assert.throws(() => generate({ storyRevision: 'story-rev-8' }), /SOCIAL_EMAIL_PACKAGE_PROVENANCE_STALE/);
  assert.throws(
    () => generate({ visualAsset: { ...visualAsset, id: asId<VisualAssetId>('visual-other') } }),
    /SOCIAL_EMAIL_PACKAGE_VISUAL_BINDING_MISMATCH/,
  );
});

test('rejects non-published story, non-ready package and character count mismatch', () => {
  assert.throws(
    () => generate({ story: { ...story, status: CanonicalStoryStatus.APPROVED, publishedAt: null } }),
    /SOCIAL_EMAIL_PACKAGE_REQUIRES_PUBLISHED_STORY/,
  );
  assert.throws(
    () => generate({ socialPackage: { ...socialPackage, status: SocialPackageStatus.DRAFT } }),
    /SOCIAL_EMAIL_PACKAGE_REQUIRES_READY_SOCIAL_PACKAGE/,
  );
  assert.throws(
    () => generate({ socialPackage: { ...socialPackage, characterCount: 1 } }),
    /SOCIAL_EMAIL_PACKAGE_CHARACTER_COUNT_MISMATCH/,
  );
});
