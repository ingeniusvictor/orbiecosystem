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
import {
  SocialContentSection,
  SocialPackageStatus,
  SocialPlatform,
  type SocialPackage,
} from '../../domain/editorial/social-package';
import {
  SocialEmailStatus,
  type SocialMailerJobId,
  buildSocialMailerSubject,
  canTransitionSocialEmailStatus,
  createSocialMailerJob,
} from '../../domain/editorial/social-mailer';

const asId = <T>(value: string): T => value as T;
const now = '2026-08-26T20:20:00.000Z' as IsoUtcDateTime;

const makeStory = (overrides: Partial<CanonicalStory> = {}): CanonicalStory => ({
  id: asId<CanonicalStoryId>('story-mailer'),
  organizationId: asId<OrganizationId>('org-orbi'),
  eventId: asId<EventId>('event-mailer'),
  verificationRecordId: asId<VerificationRecordId>('verification-mailer'),
  status: CanonicalStoryStatus.PUBLISHED,
  headline: 'ORBI prueba su flujo social',
  dek: 'Historia publicada y verificada.',
  slug: 'orbi-prueba-flujo-social',
  primaryCategory: ContentCategory.AI,
  secondaryCategories: [ContentCategory.TECH],
  tone: EditorialTone.INFORMATIVE,
  format: ContentFormat.NEWS_POST,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué pasó', body: 'Ocurrió.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Importa.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto', body: 'Impacto.' },
    { key: 'ORBI_LENS', heading: 'ORBI', body: 'Mirada ORBI.' },
  ],
  sourceRefs: [{ label: 'Fuente', url: 'https://example.com', isPrimary: true }],
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  riskLevel: RiskLevel.LOW,
  orbiScore: 95,
  socialScore: 92,
  shortScore: null,
  canonicalImageAssetId: null,
  createdAt: now,
  updatedAt: now,
  publishedAt: now,
  ...overrides,
});

const makePackage = (story = makeStory(), overrides: Partial<SocialPackage> = {}): SocialPackage => ({
  id: asId<SocialPackageId>('social-mailer-package'),
  organizationId: story.organizationId,
  canonicalStoryId: story.id,
  status: SocialPackageStatus.READY,
  targetPlatforms: [SocialPlatform.FACEBOOK, SocialPlatform.INSTAGRAM],
  socialHeadline: story.headline,
  sections: [
    { section: SocialContentSection.HOOK, text: 'Hook' },
    { section: SocialContentSection.WHAT_HAPPENED, text: 'Qué pasó' },
    { section: SocialContentSection.WHY_IT_MATTERS, text: 'Por qué importa' },
    { section: SocialContentSection.PRACTICAL_IMPLICATION, text: 'Impacto' },
    { section: SocialContentSection.ORBI_LENS, text: 'ORBI lens' },
    { section: SocialContentSection.CTA, text: 'Lee más' },
  ],
  copy: 'copy final',
  hashtags: ['#ORBIEcosystem', '#ORBINews'],
  characterCount: 10,
  imageAspectRatio: '16:9',
  imageAssetId: null,
  webArticleUrl: 'https://orbi.example/news/orbi-prueba-flujo-social',
  provenance: {
    canonicalStoryId: story.id,
    canonicalStoryRevision: 'story-rev-1',
    webArticleUrl: 'https://orbi.example/news/orbi-prueba-flujo-social',
  },
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

test('createSocialMailerJob requires published story and READY package', () => {
  const story = makeStory();
  const socialPackage = makePackage(story);
  const job = createSocialMailerJob({
    id: asId<SocialMailerJobId>('mail-job-1'),
    story,
    storyRevision: 'story-rev-2',
    socialPackage,
    socialPackageRevision: 'social-rev-4',
    recipient: 'Victor@Example.com',
    createdAt: now,
  });

  assert.equal(job.status, SocialEmailStatus.NOT_CREATED);
  assert.equal(job.recipient, 'victor@example.com');
  assert.equal(job.subject, 'ORBI News Ready — ORBI prueba su flujo social');
  assert.equal(job.provenance.canonicalStoryRevision, 'story-rev-2');
  assert.equal(job.provenance.socialPackageRevision, 'social-rev-4');
  assert.equal(job.sentAt, null);
  assert.equal(job.failureReason, null);
});

test('mailer job state is separate from social package state', () => {
  const story = makeStory();
  const socialPackage = makePackage(story);
  const job = createSocialMailerJob({
    id: asId<SocialMailerJobId>('mail-job-2'),
    story,
    storyRevision: 'story-rev-1',
    socialPackage,
    socialPackageRevision: 'social-rev-1',
    recipient: 'ops@orbi.example',
    createdAt: now,
  });

  assert.equal(socialPackage.status, SocialPackageStatus.READY);
  assert.equal(job.status, SocialEmailStatus.NOT_CREATED);
});

test('mailer job rejects unpublished story or non-ready package', () => {
  const story = makeStory();
  assert.throws(
    () => createSocialMailerJob({
      id: asId<SocialMailerJobId>('mail-job-3'),
      story: makeStory({ status: CanonicalStoryStatus.APPROVED, publishedAt: null }),
      storyRevision: 'rev-1',
      socialPackage: makePackage(story),
      socialPackageRevision: 'rev-1',
      recipient: 'ops@orbi.example',
      createdAt: now,
    }),
    /SOCIAL_MAIL_REQUIRES_PUBLISHED_STORY/,
  );

  assert.throws(
    () => createSocialMailerJob({
      id: asId<SocialMailerJobId>('mail-job-4'),
      story,
      storyRevision: 'rev-1',
      socialPackage: makePackage(story, { status: SocialPackageStatus.DRAFT }),
      socialPackageRevision: 'rev-1',
      recipient: 'ops@orbi.example',
      createdAt: now,
    }),
    /SOCIAL_MAIL_REQUIRES_READY_PACKAGE/,
  );
});

test('mailer job rejects cross-organization, cross-story and invalid recipient', () => {
  const story = makeStory();
  assert.throws(
    () => createSocialMailerJob({
      id: asId<SocialMailerJobId>('mail-job-5'),
      story,
      storyRevision: 'rev-1',
      socialPackage: makePackage(story, { organizationId: asId<OrganizationId>('org-other') }),
      socialPackageRevision: 'rev-1',
      recipient: 'ops@orbi.example',
      createdAt: now,
    }),
    /SOCIAL_MAIL_ORGANIZATION_MISMATCH/,
  );
  assert.throws(
    () => createSocialMailerJob({
      id: asId<SocialMailerJobId>('mail-job-6'),
      story,
      storyRevision: 'rev-1',
      socialPackage: makePackage(story, { canonicalStoryId: asId<CanonicalStoryId>('story-other') }),
      socialPackageRevision: 'rev-1',
      recipient: 'ops@orbi.example',
      createdAt: now,
    }),
    /SOCIAL_MAIL_STORY_MISMATCH/,
  );
  assert.throws(
    () => createSocialMailerJob({
      id: asId<SocialMailerJobId>('mail-job-7'),
      story,
      storyRevision: 'rev-1',
      socialPackage: makePackage(story),
      socialPackageRevision: 'rev-1',
      recipient: 'not-an-email',
      createdAt: now,
    }),
    /SOCIAL_MAIL_RECIPIENT_INVALID/,
  );
});

test('buildSocialMailerSubject is deterministic', () => {
  assert.equal(
    buildSocialMailerSubject(makeStory({ headline: '  Noticia validada  ' })),
    'ORBI News Ready — Noticia validada',
  );
});

test('social mail transitions are explicit and SENT is terminal', () => {
  assert.equal(canTransitionSocialEmailStatus(SocialEmailStatus.NOT_CREATED, SocialEmailStatus.GENERATING), true);
  assert.equal(canTransitionSocialEmailStatus(SocialEmailStatus.GENERATING, SocialEmailStatus.READY), true);
  assert.equal(canTransitionSocialEmailStatus(SocialEmailStatus.READY, SocialEmailStatus.SENDING), true);
  assert.equal(canTransitionSocialEmailStatus(SocialEmailStatus.SENDING, SocialEmailStatus.SENT), true);
  assert.equal(canTransitionSocialEmailStatus(SocialEmailStatus.SENT, SocialEmailStatus.SENDING), false);
  assert.equal(canTransitionSocialEmailStatus(SocialEmailStatus.FAILED, SocialEmailStatus.GENERATING), true);
  assert.equal(canTransitionSocialEmailStatus(SocialEmailStatus.FAILED, SocialEmailStatus.SENDING), false);
});
