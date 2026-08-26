import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import { EditorialRole } from '../../domain/editorial';
import {
  createHmacEditorialIdentityResolver,
  signEditorialAccessToken,
  verifyEditorialAccessToken,
} from '../../server/editorial/hmac-identity-provider';
import { mountEditorialPrivateApiIfConfigured } from '../../server/editorial/runtime-mount';

const secret = 'test-secret-only-not-production';
const nowMs = Date.UTC(2026, 7, 26, 15, 30, 0);
const nowSeconds = Math.floor(nowMs / 1000);

const claims = {
  sub: 'editor-1',
  org: 'org-1',
  role: EditorialRole.EDITOR,
  iat: nowSeconds - 10,
  exp: nowSeconds + 300,
} as const;

test('signed editorial access token resolves actor identity', () => {
  const token = signEditorialAccessToken(claims, secret);
  const actor = verifyEditorialAccessToken(token, { secret, now: () => nowMs });
  assert.deepEqual(actor, {
    actorId: 'editor-1',
    organizationId: 'org-1',
    role: EditorialRole.EDITOR,
  });
});

test('tampered editorial token is rejected', () => {
  const token = signEditorialAccessToken(claims, secret);
  const [payload, signature] = token.split('.');
  const tampered = `${payload.slice(0, -1)}A.${signature}`;
  assert.equal(verifyEditorialAccessToken(tampered, { secret, now: () => nowMs }), null);
});

test('expired editorial token is rejected', () => {
  const token = signEditorialAccessToken({
    ...claims,
    iat: nowSeconds - 500,
    exp: nowSeconds - 100,
  }, secret);
  assert.equal(
    verifyEditorialAccessToken(token, { secret, now: () => nowMs, maxClockSkewSeconds: 0 }),
    null,
  );
});

test('future-issued token beyond clock skew is rejected', () => {
  const token = signEditorialAccessToken({
    ...claims,
    iat: nowSeconds + 120,
    exp: nowSeconds + 600,
  }, secret);
  assert.equal(
    verifyEditorialAccessToken(token, { secret, now: () => nowMs, maxClockSkewSeconds: 30 }),
    null,
  );
});

test('identity resolver requires Bearer authorization', async () => {
  const resolver = createHmacEditorialIdentityResolver({ secret, now: () => nowMs });
  const token = signEditorialAccessToken(claims, secret);

  const requestWithBearer = {
    header(name: string) {
      return name.toLowerCase() === 'authorization' ? `Bearer ${token}` : undefined;
    },
  } as any;
  const requestWithoutBearer = { header: () => undefined } as any;

  assert.equal((await resolver.resolve(requestWithBearer))?.actorId, 'editor-1');
  assert.equal(await resolver.resolve(requestWithoutBearer), null);
});

test('runtime mount does not register editorial api without secret', () => {
  const app = express();
  assert.equal(mountEditorialPrivateApiIfConfigured(app, {}), false);
});

test('runtime mount registers editorial api only when secret is configured', () => {
  const app = express();
  assert.equal(
    mountEditorialPrivateApiIfConfigured(app, { ORBI_EDITORIAL_AUTH_SECRET: secret }),
    true,
  );
});
