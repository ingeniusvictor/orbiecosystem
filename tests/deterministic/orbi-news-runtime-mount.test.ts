import test from 'node:test';
import assert from 'node:assert/strict';

import type { Express } from 'express';
import type { FirestoreClientLike } from '../../server/editorial/firestore-persistence';
import { mountProductionNewsRuntimeIfConfigured } from '../../server/operations/runtime-mount';

class FakeApp {
  mounts: Array<{ path: string; handler: unknown }> = [];
  use(path: string, handler: unknown) {
    this.mounts.push({ path, handler });
    return this;
  }
}

const firestore = {
  collection() { throw new Error('not used during mount'); },
  runTransaction() { throw new Error('not used during mount'); },
} as unknown as FirestoreClientLike;

const enabledEnvironment = () => ({
  NODE_ENV: 'production',
  ORBI_NEWS_RUNTIME_ENABLED: 'true',
  ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
  ORBI_NEWS_WORKER_ID: 'worker-a',
  ORBI_NEWS_SCHEDULER_TOKEN: '0123456789abcdef0123456789abcdef',
  ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
  ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
});

test('disabled runtime does not mount any internal route', () => {
  const app = new FakeApp();
  const mounted = mountProductionNewsRuntimeIfConfigured(
    app as unknown as Express,
    {},
    { handler: async () => undefined, firestore },
  );
  assert.equal(mounted, false);
  assert.equal(app.mounts.length, 0);
});

test('enabled runtime requires scheduler authentication before mount', () => {
  const app = new FakeApp();
  const environment = enabledEnvironment();
  delete (environment as Partial<typeof environment>).ORBI_NEWS_SCHEDULER_TOKEN;
  assert.throws(() => mountProductionNewsRuntimeIfConfigured(
    app as unknown as Express,
    environment,
    { handler: async () => undefined, firestore },
  ), /ORBI_NEWS_SCHEDULER_TOKEN_REQUIRED/);
  assert.equal(app.mounts.length, 0);
});

test('fully configured runtime mounts exactly one internal scheduler router', () => {
  const app = new FakeApp();
  const mounted = mountProductionNewsRuntimeIfConfigured(
    app as unknown as Express,
    enabledEnvironment(),
    { handler: async () => undefined, firestore },
  );
  assert.equal(mounted, true);
  assert.equal(app.mounts.length, 1);
  assert.equal(app.mounts[0].path, '/api/internal/orbi-news-scheduler');
});
