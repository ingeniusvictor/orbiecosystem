import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import express from 'express';

import { EditorialControlAction, EditorialRole } from '../../domain/editorial';
import type { CanonicalStoryId } from '../../domain/common/types';
import { createHmacEditorialIdentityResolver, signEditorialAccessToken } from '../../server/editorial/hmac-identity-provider';
import { createEditorialPrivateApi } from '../../server/editorial/private-api';
import {
  EDITORIAL_CSRF_COOKIE,
  EDITORIAL_CSRF_HEADER,
  EDITORIAL_SESSION_COOKIE,
  combineEditorialIdentityResolvers,
  createEditorialSessionRouter,
  createEditorialSessionSecurity,
  resolveEditorialSessionOptions,
} from '../../server/editorial/session-auth';
import type { EditorialMutationCommandService } from '../../server/editorial/mutation-command-service';

const secret = 'editorial-signing-secret-for-session-tests';
const accessKey = 'bootstrap-access-key-that-is-long-enough';

const environment = {
  ORBI_EDITORIAL_BOOTSTRAP_ACCESS_KEY: accessKey,
  ORBI_EDITORIAL_BOOTSTRAP_ACTOR_ID: 'owner-1',
  ORBI_EDITORIAL_BOOTSTRAP_ORGANIZATION_ID: 'orbi-ecosystem',
  ORBI_EDITORIAL_BOOTSTRAP_ROLE: EditorialRole.OWNER,
  ORBI_EDITORIAL_SESSION_TTL_SECONDS: '3600',
  NODE_ENV: 'test',
};

const listen = async (app: express.Express): Promise<{ server: Server; baseUrl: string }> => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('TEST_SERVER_ADDRESS_UNAVAILABLE');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
};

const close = async (server: Server): Promise<void> =>
  new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));

const cookieValue = (setCookie: string, name: string): string => {
  const match = new RegExp(`${name}=([^;,]+)`).exec(setCookie);
  if (!match) throw new Error(`COOKIE_NOT_FOUND:${name}`);
  return match[1];
};

const buildApp = (mutationService?: EditorialMutationCommandService) => {
  const app = express();
  app.use(express.json());

  const bearer = createHmacEditorialIdentityResolver({ secret });
  const sessionSecurity = createEditorialSessionSecurity({ secret });
  const sessionOptions = resolveEditorialSessionOptions(environment, secret);
  const identityResolver = combineEditorialIdentityResolvers(bearer, sessionSecurity.identityResolver);

  app.use('/api/editorial', createEditorialSessionRouter(sessionOptions, sessionSecurity));
  app.use('/api/editorial', createEditorialPrivateApi({
    identityResolver,
    mutationService,
    sessionSecurity,
  }));

  return app;
};

test('bootstrap session configuration fails closed when partial or weak', () => {
  assert.throws(
    () => resolveEditorialSessionOptions({ ORBI_EDITORIAL_BOOTSTRAP_ACCESS_KEY: accessKey }, secret),
    /EDITORIAL_BOOTSTRAP_SESSION_CONFIG_INCOMPLETE/,
  );
  assert.throws(
    () => resolveEditorialSessionOptions({
      ...environment,
      ORBI_EDITORIAL_BOOTSTRAP_ACCESS_KEY: 'too-short',
    }, secret),
    /EDITORIAL_BOOTSTRAP_ACCESS_KEY_TOO_SHORT/,
  );
  assert.throws(
    () => resolveEditorialSessionOptions({
      ...environment,
      ORBI_EDITORIAL_BOOTSTRAP_ROLE: 'SUPERADMIN',
    }, secret),
    /EDITORIAL_BOOTSTRAP_ROLE_INVALID/,
  );
});

test('invalid bootstrap access key returns 401 without session cookies', async () => {
  const { server, baseUrl } = await listen(buildApp());
  try {
    const response = await fetch(`${baseUrl}/api/editorial/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessKey: 'wrong-access-key-value-that-is-long' }),
    });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('set-cookie'), null);
  } finally {
    await close(server);
  }
});

test('valid bootstrap login creates HttpOnly session and separate strict CSRF cookie', async () => {
  const { server, baseUrl } = await listen(buildApp());
  try {
    const response = await fetch(`${baseUrl}/api/editorial/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessKey }),
    });
    assert.equal(response.status, 200);
    const cookies = response.headers.get('set-cookie') ?? '';
    assert.match(cookies, new RegExp(`${EDITORIAL_SESSION_COOKIE}=`));
    assert.match(cookies, new RegExp(`${EDITORIAL_CSRF_COOKIE}=`));
    assert.match(cookies, /SameSite=Strict/);
    assert.match(cookies, /HttpOnly/);

    const body = await response.json() as any;
    assert.equal(body.actor.actorId, 'owner-1');
    assert.equal(body.actor.organizationId, 'orbi-ecosystem');
    assert.equal(body.actor.role, EditorialRole.OWNER);
  } finally {
    await close(server);
  }
});

test('session cookie authenticates GET session without exposing bearer to JavaScript', async () => {
  const { server, baseUrl } = await listen(buildApp());
  try {
    const login = await fetch(`${baseUrl}/api/editorial/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessKey }),
    });
    const setCookie = login.headers.get('set-cookie') ?? '';
    const session = cookieValue(setCookie, EDITORIAL_SESSION_COOKIE);

    const response = await fetch(`${baseUrl}/api/editorial/session`, {
      headers: { cookie: `${EDITORIAL_SESSION_COOKIE}=${session}` },
    });
    assert.equal(response.status, 200);
    const body = await response.json() as any;
    assert.equal(body.actor.actorId, 'owner-1');
  } finally {
    await close(server);
  }
});

test('cookie-authenticated mutation requires matching CSRF cookie and header', async () => {
  let calls = 0;
  const mutationService: EditorialMutationCommandService = {
    async execute(command) {
      calls += 1;
      return {
        ok: true,
        action: command.action,
        storyId: command.storyId,
        revision: 'rev-next',
      };
    },
  };
  const { server, baseUrl } = await listen(buildApp(mutationService));

  try {
    const login = await fetch(`${baseUrl}/api/editorial/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessKey }),
    });
    const setCookie = login.headers.get('set-cookie') ?? '';
    const session = cookieValue(setCookie, EDITORIAL_SESSION_COOKIE);
    const csrf = cookieValue(setCookie, EDITORIAL_CSRF_COOKIE);
    const cookie = `${EDITORIAL_SESSION_COOKIE}=${session}; ${EDITORIAL_CSRF_COOKIE}=${csrf}`;

    const denied = await fetch(`${baseUrl}/api/editorial/stories/story-1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify({ action: EditorialControlAction.APPROVE_STORY, expectedRevision: 'rev-1' }),
    });
    assert.equal(denied.status, 403);
    assert.equal((await denied.json() as any).error, 'EDITORIAL_CSRF_REQUIRED');
    assert.equal(calls, 0);

    const allowed = await fetch(`${baseUrl}/api/editorial/stories/story-1/actions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
        [EDITORIAL_CSRF_HEADER]: csrf,
      },
      body: JSON.stringify({ action: EditorialControlAction.APPROVE_STORY, expectedRevision: 'rev-1' }),
    });
    assert.equal(allowed.status, 200);
    assert.equal(calls, 1);
  } finally {
    await close(server);
  }
});

test('explicit bearer authentication remains usable without browser CSRF token', async () => {
  let calls = 0;
  const mutationService: EditorialMutationCommandService = {
    async execute(command) {
      calls += 1;
      return { ok: true, action: command.action, storyId: command.storyId, revision: 'rev-next' };
    },
  };
  const { server, baseUrl } = await listen(buildApp(mutationService));

  try {
    const now = Math.floor(Date.now() / 1000);
    const token = signEditorialAccessToken({
      sub: 'owner-api',
      org: 'orbi-ecosystem',
      role: EditorialRole.OWNER,
      iat: now,
      exp: now + 3600,
    }, secret);

    const response = await fetch(`${baseUrl}/api/editorial/stories/story-1/actions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ action: EditorialControlAction.APPROVE_STORY, expectedRevision: 'rev-1' }),
    });
    assert.equal(response.status, 200);
    assert.equal(calls, 1);
  } finally {
    await close(server);
  }
});

test('logout rejects missing CSRF for cookie session and clears both cookies when valid', async () => {
  const { server, baseUrl } = await listen(buildApp());
  try {
    const login = await fetch(`${baseUrl}/api/editorial/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessKey }),
    });
    const setCookie = login.headers.get('set-cookie') ?? '';
    const session = cookieValue(setCookie, EDITORIAL_SESSION_COOKIE);
    const csrf = cookieValue(setCookie, EDITORIAL_CSRF_COOKIE);
    const cookie = `${EDITORIAL_SESSION_COOKIE}=${session}; ${EDITORIAL_CSRF_COOKIE}=${csrf}`;

    const denied = await fetch(`${baseUrl}/api/editorial/session`, {
      method: 'DELETE',
      headers: { cookie },
    });
    assert.equal(denied.status, 403);

    const allowed = await fetch(`${baseUrl}/api/editorial/session`, {
      method: 'DELETE',
      headers: { cookie, [EDITORIAL_CSRF_HEADER]: csrf },
    });
    assert.equal(allowed.status, 204);
    const cleared = allowed.headers.get('set-cookie') ?? '';
    assert.match(cleared, new RegExp(`${EDITORIAL_SESSION_COOKIE}=`));
    assert.match(cleared, new RegExp(`${EDITORIAL_CSRF_COOKIE}=`));
    assert.match(cleared, /Max-Age=0/);
  } finally {
    await close(server);
  }
});
