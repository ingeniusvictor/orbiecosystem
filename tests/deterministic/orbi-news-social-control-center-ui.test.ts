import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EditorialControlAction,
  EditorialQueueBucket,
  ManualPublicationStatus,
  SocialEmailStatus,
  SocialReadinessDecision,
} from '../../domain/editorial';
import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import {
  EditorialRepositoryError,
  createHttpEditorialControlCenterRepository,
} from '../../src/editorial/repository';
import {
  getSocialDistributionSummary,
  MANUAL_PUBLICATION_LABELS,
  SOCIAL_EMAIL_LABELS,
  SOCIAL_READINESS_LABELS,
} from '../../src/editorial/presentation';

const socialDistribution = {
  readiness: SocialReadinessDecision.READY,
  socialScore: 92,
  copy: 'Copy social final listo para distribución.',
  characterCount: 41,
  hashtags: ['#ORBIEcosystem', '#ORBINews'],
  imageUrl: 'https://orbi.example/assets/social-1.jpg',
  mailerStatus: SocialEmailStatus.SENT,
  facebookStatus: ManualPublicationStatus.POSTED,
  instagramStatus: ManualPublicationStatus.NOT_POSTED,
};

const queueItem = {
  storyId: 'story-social-ui',
  revision: 'rev-22',
  headline: 'Historia social publicada',
  slug: 'historia-social-publicada',
  category: ContentCategory.AI,
  riskLevel: RiskLevel.LOW,
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  orbiScore: 94,
  updatedAt: '2026-08-26T21:20:00Z',
  bucket: EditorialQueueBucket.PUBLISHED,
  requiresHumanAttention: false,
  attentionReasons: [],
  actionAssessments: [
    { action: EditorialControlAction.PUBLISH_WEB_NOW, allowed: false, reasons: ['PUBLISHED_STORY_IMMUTABLE'] },
  ],
  socialDistribution,
};

test('social distribution presentation exposes independent readiness, mail and platform states', () => {
  assert.equal(SOCIAL_READINESS_LABELS[SocialReadinessDecision.READY], 'Listo');
  assert.equal(SOCIAL_EMAIL_LABELS[SocialEmailStatus.SENT], 'Enviado');
  assert.equal(MANUAL_PUBLICATION_LABELS[ManualPublicationStatus.POSTED], 'Publicado');
  assert.match(getSocialDistributionSummary(socialDistribution), /Facebook: Publicado/);
  assert.match(getSocialDistributionSummary(socialDistribution), /Instagram: No publicado/);
});

test('editorial repository accepts a valid optional social distribution view', async () => {
  const repository = createHttpEditorialControlCenterRepository({
    fetchImpl: async () => new Response(JSON.stringify({ items: [queueItem] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  });

  const items = await repository.listQueue();
  assert.equal(items[0].socialDistribution?.readiness, SocialReadinessDecision.READY);
  assert.equal(items[0].socialDistribution?.mailerStatus, SocialEmailStatus.SENT);
  assert.equal(items[0].socialDistribution?.facebookStatus, ManualPublicationStatus.POSTED);
  assert.equal(items[0].socialDistribution?.instagramStatus, ManualPublicationStatus.NOT_POSTED);
});

test('editorial repository rejects malformed social distribution state fail-closed', async () => {
  const malformed = {
    ...queueItem,
    socialDistribution: {
      ...socialDistribution,
      readiness: 'READY_BUT_UNVERIFIED',
    },
  };
  const repository = createHttpEditorialControlCenterRepository({
    fetchImpl: async () => new Response(JSON.stringify({ items: [malformed] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  });

  await assert.rejects(repository.listQueue(), (error: unknown) =>
    error instanceof EditorialRepositoryError && error.code === 'EDITORIAL_QUEUE_INVALID_RESPONSE');
});

test('absence of social view is explicit and does not fabricate readiness', () => {
  assert.equal(getSocialDistributionSummary(null), 'Paquete social no preparado');
});
