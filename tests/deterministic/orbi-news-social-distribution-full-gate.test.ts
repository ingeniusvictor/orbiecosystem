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
import { applySocialDistributionPolicy } from '../../domain/editorial/social-distribution-policy';
import { generateSocialEmailPackage } from '../../domain/editorial/social-email-package';
import { bindSocialImage } from '../../domain/editorial/social-image-binding';
import {
  SocialEmailStatus,
  type SocialMailerJobId,
  createSocialMailerJob,
  transitionSocialMailerJob,
} from '../../domain/editorial/social-mailer';
import { countSocialCopyCharacters } from '../../domain/editorial/social-length-policy';
import { SocialPackageStatus, SocialPlatform } from '../../domain/editorial/social-package';
import {
  createManualPublicationTracker,
  isManualPublicationComplete,
  markManualPublicationPosted,
} from '../../domain/editorial/social-publication-tracker';
import {
  SocialReadinessDecision,
  evaluateSocialReadiness,
  markSocialPackageReady,
} from '../../domain/editorial/social-readiness-gate';
import { SocialScoreBand, calculateSocialScore } from '../../domain/editorial/social-scoring';
import {
  VisualAssetOrigin,
  VisualAssetStatus,
  VisualTruthLabel,
  type VisualAsset,
  type VisualAssetId,
} from '../../domain/visuals/visual-asset';

const asId = <T>(value: string): T => value as T;
const at = (value: string): IsoUtcDateTime => value as IsoUtcDateTime;
const orgId = asId<OrganizationId>('org-orbi');
const storyId = asId<CanonicalStoryId>('story-full-social');
const storyRevision = 'story-rev-12';
const socialPackageRevision = 'social-rev-ready-1';
const visualId = asId<VisualAssetId>('visual-full-social');
const articleUrl = 'https://orbi.example/news/full-social-distribution';

const storyBody = (label: string): string => `${label}: ${'dato verificado '.repeat(22)}`.trim();

const makeStory = (overrides: Partial<CanonicalStory> = {}): CanonicalStory => {
  const socialScore = calculateSocialScore({
    audienceInterest: 92,
    visualPotential: 90,
    conversationPotential: 88,
    practicalValue: 94,
    novelty: 86,
    brandFit: 96,
  });
  assert.equal(socialScore.band, SocialScoreBand.PRIORITY);

  return {
    id: storyId,
    organizationId: orgId,
    eventId: asId<EventId>('event-full-social'),
    verificationRecordId: asId<VerificationRecordId>('verification-full-social'),
    status: CanonicalStoryStatus.PUBLISHED,
    headline: 'ORBI verifica un avance tecnológico con impacto práctico',
    dek: 'Historia publicada y verificada para el full social distribution gate.',
    slug: 'full-social-distribution',
    primaryCategory: ContentCategory.AI,
    secondaryCategories: [ContentCategory.AUTOMATION, ContentCategory.TECH],
    tone: EditorialTone.INFORMATIVE,
    format: ContentFormat.NEWS_POST,
    sections: [
      { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen verificado.' },
      { key: 'WHAT_HAPPENED', heading: 'Qué pasó', body: storyBody('Qué pasó') },
      { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: storyBody('Por qué importa') },
      { key: 'PRACTICAL_IMPACT', heading: 'Impacto práctico', body: storyBody('Impacto práctico') },
      { key: 'ORBI_LENS', heading: 'Mirada ORBI', body: storyBody('Mirada ORBI') },
    ],
    sourceRefs: [{ label: 'Fuente oficial', url: 'https://example.com/official', isPrimary: true }],
    verificationConfidence: VerificationConfidence.VERY_HIGH,
    riskLevel: RiskLevel.LOW,
    orbiScore: 93,
    socialScore: socialScore.total,
    shortScore: null,
    canonicalImageAssetId: visualId,
    createdAt: at('2026-08-26T20:00:00.000Z'),
    updatedAt: at('2026-08-26T20:05:00.000Z'),
    publishedAt: at('2026-08-26T20:05:00.000Z'),
    ...overrides,
  };
};

const makeVisual = (overrides: Partial<VisualAsset> = {}): VisualAsset => ({
  id: visualId,
  organizationId: orgId,
  canonicalStoryId: storyId,
  status: VisualAssetStatus.VALIDATED,
  origin: VisualAssetOrigin.AI_GENERATED,
  truthLabel: VisualTruthLabel.EDITORIAL_CONCEPT,
  category: ContentCategory.AI,
  aspectRatio: '16:9',
  width: 1600,
  height: 900,
  assetUrl: 'https://cdn.orbi.example/full-social.webp',
  overlayText: 'ORBI News',
  createdAt: at('2026-08-26T20:06:00.000Z'),
  updatedAt: at('2026-08-26T20:06:00.000Z'),
  ...overrides,
});

const buildBoundDraft = (story = makeStory(), visual = makeVisual()) => {
  const draft = buildSocialPackageDraft({
    id: asId<SocialPackageId>('social-full-gate'),
    story,
    storyRevision,
    webArticleUrl: articleUrl,
    ctaText: 'CTA temporal.',
    createdAt: at('2026-08-26T20:07:00.000Z'),
  });
  const withDistribution = applySocialDistributionPolicy(story, draft);
  return bindSocialImage({
    socialPackage: withDistribution,
    visualAsset: visual,
    boundAt: at('2026-08-26T20:08:00.000Z'),
  });
};

test('full gate composes published story through READY, email SENT and both manual platforms POSTED', () => {
  const story = makeStory();
  const visual = makeVisual();
  const boundDraft = buildBoundDraft(story, visual);

  assert.equal(boundDraft.status, SocialPackageStatus.DRAFT);
  assert.ok(boundDraft.characterCount >= 1500 && boundDraft.characterCount <= 1900);
  assert.equal(boundDraft.characterCount, countSocialCopyCharacters(boundDraft.copy));

  const readiness = evaluateSocialReadiness({ story, storyRevision, socialPackage: boundDraft, visualAsset: visual });
  assert.equal(readiness.decision, SocialReadinessDecision.READY);

  const readyPackage = markSocialPackageReady({
    story,
    storyRevision,
    socialPackage: boundDraft,
    visualAsset: visual,
    readyAt: at('2026-08-26T20:09:00.000Z'),
  });
  assert.equal(readyPackage.status, SocialPackageStatus.READY);

  let mailer = createSocialMailerJob({
    id: 'mailer-full-social' as SocialMailerJobId,
    story,
    storyRevision,
    socialPackage: readyPackage,
    socialPackageRevision,
    recipient: 'editorial@orbi.example',
    createdAt: at('2026-08-26T20:10:00.000Z'),
  });
  mailer = transitionSocialMailerJob({ job: mailer, to: SocialEmailStatus.GENERATING, transitionedAt: at('2026-08-26T20:11:00.000Z') });

  const emailPackage = generateSocialEmailPackage({
    story,
    storyRevision,
    socialPackage: readyPackage,
    socialPackageRevision,
    visualAsset: visual,
    mailerJob: mailer,
  });
  assert.equal(emailPackage.publicPackage.socialCopy, readyPackage.copy);
  assert.equal(emailPackage.privateVerification.verificationConfidence, VerificationConfidence.VERY_HIGH);
  assert.equal(emailPackage.privateVerification.sources.length, 1);

  mailer = transitionSocialMailerJob({ job: mailer, to: SocialEmailStatus.READY, transitionedAt: at('2026-08-26T20:12:00.000Z') });
  mailer = transitionSocialMailerJob({ job: mailer, to: SocialEmailStatus.SENDING, transitionedAt: at('2026-08-26T20:13:00.000Z') });
  mailer = transitionSocialMailerJob({ job: mailer, to: SocialEmailStatus.SENT, transitionedAt: at('2026-08-26T20:14:00.000Z') });
  assert.equal(mailer.status, SocialEmailStatus.SENT);
  assert.equal(mailer.sentAt, at('2026-08-26T20:14:00.000Z'));

  let tracker = createManualPublicationTracker(readyPackage, socialPackageRevision, at('2026-08-26T20:15:00.000Z'));
  tracker = markManualPublicationPosted({
    tracker,
    socialPackage: readyPackage,
    packageRevision: socialPackageRevision,
    platform: SocialPlatform.FACEBOOK,
    postUrl: 'https://facebook.example/orbi/posts/1',
    actor: { actorId: 'owner-1', displayName: 'ORBI Owner' },
    postedAt: at('2026-08-26T20:16:00.000Z'),
  });
  assert.equal(isManualPublicationComplete(tracker), false);

  tracker = markManualPublicationPosted({
    tracker,
    socialPackage: readyPackage,
    packageRevision: socialPackageRevision,
    platform: SocialPlatform.INSTAGRAM,
    postUrl: 'https://instagram.example/p/1',
    actor: { actorId: 'owner-1', displayName: 'ORBI Owner' },
    postedAt: at('2026-08-26T20:17:00.000Z'),
  });
  assert.equal(isManualPublicationComplete(tracker), true);
});

test('hard limit cannot be promoted to READY even with falsified stored count', () => {
  const story = makeStory();
  const visual = makeVisual();
  const boundDraft = buildBoundDraft(story, visual);
  const oversized = { ...boundDraft, copy: 'x'.repeat(2201), characterCount: 1 };

  const readiness = evaluateSocialReadiness({ story, storyRevision, socialPackage: oversized, visualAsset: visual });
  assert.equal(readiness.decision, SocialReadinessDecision.BLOCK);
  assert.ok(readiness.reasons.includes('SOCIAL_COPY_HARD_LIMIT_EXCEEDED'));
  assert.throws(
    () => markSocialPackageReady({ story, storyRevision, socialPackage: oversized, visualAsset: visual, readyAt: at('2026-08-26T20:20:00.000Z') }),
    /SOCIAL_PACKAGE_READY_TRANSITION_DENIED:BLOCK/,
  );
});

test('stale story provenance cannot be promoted to READY', () => {
  const story = makeStory();
  const visual = makeVisual();
  const boundDraft = buildBoundDraft(story, visual);

  assert.throws(
    () => markSocialPackageReady({ story, storyRevision: 'story-rev-13', socialPackage: boundDraft, visualAsset: visual, readyAt: at('2026-08-26T20:21:00.000Z') }),
    /SOCIAL_PACKAGE_READY_TRANSITION_DENIED:DEFER/,
  );
});

test('cross-organization visual is blocked before readiness materialization', () => {
  const story = makeStory();
  const draft = buildSocialPackageDraft({
    id: asId<SocialPackageId>('social-cross-org'),
    story,
    storyRevision,
    webArticleUrl: articleUrl,
    ctaText: 'CTA temporal.',
    createdAt: at('2026-08-26T20:22:00.000Z'),
  });
  const withDistribution = applySocialDistributionPolicy(story, draft);

  assert.throws(
    () => bindSocialImage({
      socialPackage: withDistribution,
      visualAsset: makeVisual({ organizationId: asId<OrganizationId>('other-org') }),
      boundAt: at('2026-08-26T20:23:00.000Z'),
    }),
    /SOCIAL_VISUAL_ORGANIZATION_MISMATCH/,
  );
});

test('manual publication tracker blocks a second different post for an already POSTED platform', () => {
  const story = makeStory();
  const visual = makeVisual();
  const readyPackage = markSocialPackageReady({
    story,
    storyRevision,
    socialPackage: buildBoundDraft(story, visual),
    visualAsset: visual,
    readyAt: at('2026-08-26T20:24:00.000Z'),
  });
  let tracker = createManualPublicationTracker(readyPackage, socialPackageRevision, at('2026-08-26T20:25:00.000Z'));
  tracker = markManualPublicationPosted({
    tracker,
    socialPackage: readyPackage,
    packageRevision: socialPackageRevision,
    platform: SocialPlatform.FACEBOOK,
    postUrl: 'https://facebook.example/orbi/posts/original',
    actor: { actorId: 'owner-1', displayName: 'ORBI Owner' },
    postedAt: at('2026-08-26T20:26:00.000Z'),
  });

  assert.throws(
    () => markManualPublicationPosted({
      tracker,
      socialPackage: readyPackage,
      packageRevision: socialPackageRevision,
      platform: SocialPlatform.FACEBOOK,
      postUrl: 'https://facebook.example/orbi/posts/duplicate',
      actor: { actorId: 'owner-1', displayName: 'ORBI Owner' },
      postedAt: at('2026-08-26T20:27:00.000Z'),
    }),
    /MANUAL_PUBLICATION_DUPLICATE_POST_REQUIRES_EXPLICIT_REVIEW/,
  );
});
