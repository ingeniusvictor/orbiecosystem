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
import {
  buildEditorialActionConfirmation,
  getEditorialActionDisplayState,
} from '../../src/editorial/presentation';
import { getSeoRouteMetadata } from '../../src/seoMetadata';

const queueItem = {
  storyId: 'story-1',
  revision: 'rev-17',
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
    { action: EditorialControlAction.APPROVE_STORY, allowed: true, reasons: [] },
    { action: EditorialControlAction.PUBLISH_WEB_NOW, allowed: false, reasons: ['ROLE_NOT_AUTHORIZED'] },
  ],
};

test('editorial repository does not call fetch without token for reads or mutations', async () => {
  let calls = 0;
  const repository = createHttpEditorialControlCenterRepository({
    tokenProvider: () => null,
    fetchImpl: async () => { calls += 1; return new Response('{}'); },
  });

  await assert.rejects(repository.listQueue(), (error: unknown) =>
    error instanceof EditorialRepositoryError && error.code === 'EDITORIAL_AUTH_TOKEN_UNAVAILABLE');
  await assert.rejects(repository.executeAction({ storyId: 'story-1', action: EditorialControlAction.APPROVE_STORY, expectedRevision: 'rev-17' }), (error: unknown) =>
    error instanceof EditorialRepositoryError && error.code === 'EDITORIAL_AUTH_TOKEN_UNAVAILABLE');
  assert.equal(calls, 0);
});

test('editorial repository validates queue revision and sends bearer token', async () => {
  let requestedUrl = '';
  let authorization = '';
  const repository = createHttpEditorialControlCenterRepository({
    tokenProvider: () => 'signed-editorial-token',
    fetchImpl: async (input, init) => {
      requestedUrl = String(input);
      authorization = new Headers(init?.headers).get('authorization') ?? '';
      return new Response(JSON.stringify({ items: [queueItem] }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  const items = await repository.listQueue(EditorialQueueBucket.NEEDS_REVIEW);
  assert.equal(requestedUrl, '/api/editorial/queue?bucket=NEEDS_REVIEW');
  assert.equal(authorization, 'Bearer signed-editorial-token');
  assert.equal(items[0].revision, 'rev-17');
});

test('queue payload without revision is rejected', async () => {
  const { revision: _revision, ...withoutRevision } = queueItem;
  const repository = createHttpEditorialControlCenterRepository({
    tokenProvider: () => 'token',
    fetchImpl: async () => new Response(JSON.stringify({ items: [withoutRevision] }), { status: 200, headers: { 'content-type': 'application/json' } }),
  });
  await assert.rejects(repository.listQueue(), (error: unknown) =>
    error instanceof EditorialRepositoryError && error.code === 'EDITORIAL_QUEUE_INVALID_RESPONSE');
});

test('mutation client posts action and exact observed revision without identity fields', async () => {
  let body: Record<string, unknown> = {};
  let method = '';
  const repository = createHttpEditorialControlCenterRepository({
    tokenProvider: () => 'signed-editorial-token',
    fetchImpl: async (_input, init) => {
      method = init?.method ?? '';
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ ok: true, action: EditorialControlAction.APPROVE_STORY, storyId: 'story-1', revision: 'rev-18' }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  const result = await repository.executeAction({
    storyId: 'story-1',
    action: EditorialControlAction.APPROVE_STORY,
    expectedRevision: 'rev-17',
    reason: '  revisión completa  ',
  });

  assert.equal(method, 'POST');
  assert.deepEqual(body, {
    action: EditorialControlAction.APPROVE_STORY,
    expectedRevision: 'rev-17',
    reason: 'revisión completa',
  });
  assert.equal('role' in body, false);
  assert.equal('organizationId' in body, false);
  assert.equal(result.revision, 'rev-18');
});

test('mutation client maps conflict and not-configured statuses', async () => {
  for (const [status, code] of [[409, 'EDITORIAL_ACTION_CONFLICT'], [503, 'EDITORIAL_MUTATION_NOT_CONFIGURED']] as const) {
    const repository = createHttpEditorialControlCenterRepository({
      tokenProvider: () => 'token',
      fetchImpl: async () => new Response(JSON.stringify({ reasons: ['TEST_REASON'] }), { status, headers: { 'content-type': 'application/json' } }),
    });
    await assert.rejects(repository.executeAction({ storyId: 'story-1', action: EditorialControlAction.APPROVE_STORY, expectedRevision: 'rev-17' }), (error: unknown) =>
      error instanceof EditorialRepositoryError && error.code === code && error.reasons.includes('TEST_REASON'));
  }
});

test('allowed actions become executable presentation candidates while blocked reasons remain visible', () => {
  const allowed = getEditorialActionDisplayState({ action: EditorialControlAction.APPROVE_STORY, allowed: true, reasons: [] });
  const blocked = getEditorialActionDisplayState({ action: EditorialControlAction.PUBLISH_WEB_NOW, allowed: false, reasons: ['ROLE_NOT_AUTHORIZED'] });
  assert.equal(allowed.domainAllowed, true);
  assert.equal(allowed.disabledReason, null);
  assert.equal(blocked.disabledReason, 'ROLE_NOT_AUTHORIZED');
});

test('publish-now requires reinforced confirmation copy', () => {
  const confirmation = buildEditorialActionConfirmation(EditorialControlAction.PUBLISH_WEB_NOW, 'Historia');
  assert.match(confirmation, /Confirmación reforzada/);
  assert.match(confirmation, /volverá a validar/);
});

test('editorial route metadata is noindex and excluded from public routes', async () => {
  const metadata = getSeoRouteMetadata('editorial');
  assert.equal(metadata.robots, 'noindex,nofollow');
  const module = await import('../../src/seoMetadata');
  assert.equal(module.seoPublicRoutes.some((route) => route.endsWith('/editorial')), false);
});
