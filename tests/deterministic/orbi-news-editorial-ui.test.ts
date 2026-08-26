import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EditorialControlAction,
  EditorialQueueBucket,
  EditorialRole,
} from '../../domain/editorial';
import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import {
  EDITORIAL_CSRF_HEADER,
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

test('default editorial repository uses same-origin cookie session for queue reads', async () => {
  let requestedUrl = '';
  let credentials: RequestCredentials | undefined;
  let authorization: string | null = 'unexpected';
  const repository = createHttpEditorialControlCenterRepository({
    fetchImpl: async (input, init) => {
      requestedUrl = String(input);
      credentials = init?.credentials;
      authorization = new Headers(init?.headers).get('authorization');
      return new Response(JSON.stringify({ items: [queueItem] }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  const items = await repository.listQueue(EditorialQueueBucket.NEEDS_REVIEW);
  assert.equal(requestedUrl, '/api/editorial/queue?bucket=NEEDS_REVIEW');
  assert.equal(credentials, 'same-origin');
  assert.equal(authorization, null);
  assert.equal(items[0].revision, 'rev-17');
});

test('explicit bearer provider remains supported and takes authority over ambient session', async () => {
  let authorization = '';
  const repository = createHttpEditorialControlCenterRepository({
    tokenProvider: () => 'signed-editorial-token',
    fetchImpl: async (_input, init) => {
      authorization = new Headers(init?.headers).get('authorization') ?? '';
      return new Response(JSON.stringify({ items: [queueItem] }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  await repository.listQueue();
  assert.equal(authorization, 'Bearer signed-editorial-token');
});

test('queue payload without revision is rejected', async () => {
  const { revision: _revision, ...withoutRevision } = queueItem;
  const repository = createHttpEditorialControlCenterRepository({
    fetchImpl: async () => new Response(JSON.stringify({ items: [withoutRevision] }), { status: 200, headers: { 'content-type': 'application/json' } }),
  });
  await assert.rejects(repository.listQueue(), (error: unknown) =>
    error instanceof EditorialRepositoryError && error.code === 'EDITORIAL_QUEUE_INVALID_RESPONSE');
});

test('cookie mutation sends CSRF, exact revision, same-origin credentials and no identity fields', async () => {
  let body: Record<string, unknown> = {};
  let method = '';
  let credentials: RequestCredentials | undefined;
  let csrfHeader = '';
  let authorization: string | null = 'unexpected';
  const repository = createHttpEditorialControlCenterRepository({
    csrfProvider: () => 'csrf-from-readable-cookie',
    fetchImpl: async (_input, init) => {
      method = init?.method ?? '';
      credentials = init?.credentials;
      const headers = new Headers(init?.headers);
      csrfHeader = headers.get(EDITORIAL_CSRF_HEADER) ?? '';
      authorization = headers.get('authorization');
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        result: {
          ok: true,
          action: EditorialControlAction.APPROVE_STORY,
          storyId: 'story-1',
          revision: 'rev-18',
        },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  const result = await repository.executeAction({
    storyId: 'story-1',
    action: EditorialControlAction.APPROVE_STORY,
    expectedRevision: 'rev-17',
    reason: '  revisión completa  ',
  });

  assert.equal(method, 'POST');
  assert.equal(credentials, 'same-origin');
  assert.equal(csrfHeader, 'csrf-from-readable-cookie');
  assert.equal(authorization, null);
  assert.deepEqual(body, {
    action: EditorialControlAction.APPROVE_STORY,
    expectedRevision: 'rev-17',
    reason: 'revisión completa',
  });
  assert.equal('role' in body, false);
  assert.equal('actorId' in body, false);
  assert.equal('organizationId' in body, false);
  assert.equal(result.revision, 'rev-18');
});

test('cookie mutation fails before fetch when CSRF token is unavailable', async () => {
  let calls = 0;
  const repository = createHttpEditorialControlCenterRepository({
    csrfProvider: () => null,
    fetchImpl: async () => {
      calls += 1;
      return new Response('{}');
    },
  });

  await assert.rejects(
    repository.executeAction({
      storyId: 'story-1',
      action: EditorialControlAction.APPROVE_STORY,
      expectedRevision: 'rev-17',
    }),
    (error: unknown) => error instanceof EditorialRepositoryError && error.code === 'EDITORIAL_CSRF_TOKEN_UNAVAILABLE',
  );
  assert.equal(calls, 0);
});

test('bearer mutation does not require browser CSRF', async () => {
  let csrfCalls = 0;
  const repository = createHttpEditorialControlCenterRepository({
    tokenProvider: () => 'api-bearer',
    csrfProvider: () => {
      csrfCalls += 1;
      return null;
    },
    fetchImpl: async () => new Response(JSON.stringify({
      result: {
        ok: true,
        action: EditorialControlAction.APPROVE_STORY,
        storyId: 'story-1',
        revision: 'rev-18',
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } }),
  });

  await repository.executeAction({
    storyId: 'story-1',
    action: EditorialControlAction.APPROVE_STORY,
    expectedRevision: 'rev-17',
  });
  assert.equal(csrfCalls, 0);
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

test('session login uses same-origin cookie flow and never returns a browser bearer token', async () => {
  let body: Record<string, unknown> = {};
  let credentials: RequestCredentials | undefined;
  const repository = createHttpEditorialControlCenterRepository({
    fetchImpl: async (_input, init) => {
      credentials = init?.credentials;
      body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        actor: { actorId: 'owner-1', organizationId: 'orbi-ecosystem', role: EditorialRole.OWNER },
        expiresAt: '2026-08-27T00:00:00.000Z',
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    },
  });

  const session = await repository.login('  private-bootstrap-key  ');
  assert.equal(credentials, 'same-origin');
  assert.deepEqual(body, { accessKey: 'private-bootstrap-key' });
  assert.equal(session.actor.role, EditorialRole.OWNER);
  assert.equal('token' in session, false);
});

test('getSession maps 401 to unauthenticated null and validates authenticated actor', async () => {
  const unauthenticated = createHttpEditorialControlCenterRepository({
    fetchImpl: async () => new Response(JSON.stringify({ error: 'EDITORIAL_AUTHENTICATION_REQUIRED' }), { status: 401 }),
  });
  assert.equal(await unauthenticated.getSession(), null);

  const authenticated = createHttpEditorialControlCenterRepository({
    fetchImpl: async () => new Response(JSON.stringify({
      actor: { actorId: 'owner-1', organizationId: 'orbi-ecosystem', role: EditorialRole.OWNER },
    }), { status: 200, headers: { 'content-type': 'application/json' } }),
  });
  assert.equal((await authenticated.getSession())?.actor.actorId, 'owner-1');
});

test('logout requires readable CSRF and sends same-origin DELETE', async () => {
  let method = '';
  let credentials: RequestCredentials | undefined;
  let csrf = '';
  const repository = createHttpEditorialControlCenterRepository({
    csrfProvider: () => 'csrf-session-value',
    fetchImpl: async (_input, init) => {
      method = init?.method ?? '';
      credentials = init?.credentials;
      csrf = new Headers(init?.headers).get(EDITORIAL_CSRF_HEADER) ?? '';
      return new Response(null, { status: 204 });
    },
  });

  await repository.logout();
  assert.equal(method, 'DELETE');
  assert.equal(credentials, 'same-origin');
  assert.equal(csrf, 'csrf-session-value');
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
