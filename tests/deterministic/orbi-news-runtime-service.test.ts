import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createOrbiNewsRuntimeApp } from '../../orbi-news-runtime';

const listen = async (app: ReturnType<typeof createOrbiNewsRuntimeApp>) => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('TEST_SERVER_ADDRESS_INVALID');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
};

test('standalone runtime healthz is healthy and inert when activation profile is disabled', async () => {
  const { server, baseUrl } = await listen(createOrbiNewsRuntimeApp({ NODE_ENV: 'test' } as NodeJS.ProcessEnv));
  try {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);
    const body = await response.json() as any;
    assert.equal(body.service, 'orbi-news-runtime');
    assert.equal(body.activationProfile, 'DISABLED');
  } finally {
    server.close();
  }
});

test('healthz reports 503 for malformed activation configuration instead of claiming ready', async () => {
  const app = createOrbiNewsRuntimeApp({ NODE_ENV: 'test', ORBI_NEWS_ACTIVATION_PROFILE: 'BROKEN' } as NodeJS.ProcessEnv);
  const { server, baseUrl } = await listen(app);
  try {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 503);
    const body = await response.json() as any;
    assert.equal(body.ready, false);
  } finally {
    server.close();
  }
});
