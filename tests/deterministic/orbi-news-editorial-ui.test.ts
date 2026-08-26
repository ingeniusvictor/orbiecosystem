import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EditorialControlAction,
  EditorialQueueBucket,
} from '../../domain/editorial';
import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import {
  EditorialRepositoryError,
  createHttpEditorialControlCenterRepository,
} from '../../src/editorial/repository';
import { getEditorialActionDisplayState } from '../../src/editorial/presentation';
import { getSeoRouteMetadata } from '../../src/seoMetadata';

const queueItem = {
  storyId: 'story-1',
  headline: 'Historia editorial verificada',
  slug: 'historia-editorial-verificada',
  category: ContentCategory.AI,
  riskLevel: RiskLevel.LOW,
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  orbiScore: 94,
  updatedAt: '2026-08-26T15:45:00Z',
  bucket: EditorialQueueBucket.NEEDS_REVIEW,
  requiresHumanAttention: true,
  attentionReasons: ['HUMAN_EDITORIAL_REVIEW_REQUIRED'],
  actionAssessments: [
    {
      action: EditorialControlAction.APPROVE_STORY,
      allowed: true,
      reasons: [],
    },
    {
      action: EditorialControlAction.PUBLISH_WEB_NOW,
      allowed: false,
      reasons: ['ROLE_NOT_AUTHORIZED'],
    },
  ],
};

test('editorial repository does not call fetch when no token is available', async () => {
  let calls = 0;
  const repository = createHttpEditorialControlCenterRepository({
    tokenProvider: () => null,
    fetchImpl: async () => {
      calls += 1;
      return new Response('{}');
    },
  });

  await assert.rejects(
    repository.listQueue(),
    (error: unknown) => error instanceof EditorialRepositoryError && error.code === 'EDITORIAL_AUTH_TOKEN_UNAVAILABLE',
  );
  assert.equal(calls, 0);
});

test('editorial repository sends bearer token and canonical bucket filter', async () => {
  let requestedUrl = '';
  let authorization = '';
  const repository = createHttpEditorialControlCenterRepository({
    tokenProvider: () => 'signed-editorial-token',
    fetchImpl: async (input, init) => {
      requestedUrl = String(input);
      authorization = new Headers(init?.headers).get('authorization') ?? '';
      return new Response(JSON.stringify({ items: [queueItem] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  const items = await repository.listQueue(EditorialQueueBucket.NEEDS_REVIEW);
  assert.equal(requestedUrl, '/api/editorial/queue?bucket=NEEDS_REVIEW');
  assert.equal(authorization, 'Bearer signed-editorial-token');
  assert.equal(items.length, 1);
  assert.equal(items[0].headline, queueItem.headline);
});

test('editorial repository rejects structurally invalid queue payloads', async () => {
  const repository = createHttpEditorialControlCenterRepository({
    tokenProvider: () => 'signed-editorial-token',
    fetchImpl: async () => new Response(JSON.stringify({ items: [{ headline: 'partial' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  });

  await assert.rejects(
    repository.listQueue(),
    (error: unknown) => error instanceof EditorialRepositoryError && error.code === 'EDITORIAL_QUEUE_INVALID_RESPONSE',
  );
});

test('allowed domain action remains non-executable in NA-08.9 presentation', () => {
  const state = getEditorialActionDisplayState({
    action: EditorialControlAction.APPROVE_STORY,
    allowed: true,
    reasons: [],
  });

  assert.equal(state.domainAllowed, true);
  assert.equal(state.disabledReason, 'EJECUCION_MUTABLE_NO_HABILITADA_EN_NA_08_9');
});

test('blocked domain action preserves deterministic reasons', () => {
  const state = getEditorialActionDisplayState({
    action: EditorialControlAction.PUBLISH_WEB_NOW,
    allowed: false,
    reasons: ['ROLE_NOT_AUTHORIZED', 'STORY_NOT_APPROVED'],
  });

  assert.equal(state.domainAllowed, false);
  assert.equal(state.disabledReason, 'ROLE_NOT_AUTHORIZED, STORY_NOT_APPROVED');
});

test('editorial route metadata is noindex and is excluded from public routes', async () => {
  const metadata = getSeoRouteMetadata('editorial');
  assert.equal(metadata.robots, 'noindex,nofollow');
  assert.equal(metadata.canonical.endsWith('/editorial'), true);

  const module = await import('../../src/seoMetadata');
  assert.equal(module.seoPublicRoutes.some((route) => route.endsWith('/editorial')), false);
});
