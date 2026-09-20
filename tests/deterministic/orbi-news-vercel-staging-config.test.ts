import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseEnvironmentSourceRegistry } from '../../server/discovery/environment-source-registry';

const rootFile = (name: string) => new URL(`../../${name}`, import.meta.url);

test('Vercel staging config remains Hobby-safe with no automatic cron schedules', async () => {
  const raw = await readFile(rootFile('vercel.staging.json'), 'utf8');
  const parsed = JSON.parse(raw) as { crons?: unknown; rewrites?: unknown };
  assert.equal(parsed.crons, undefined);
  assert.ok(Array.isArray(parsed.rewrites));
});

test('staging environment template contains placeholders rather than real secrets', async () => {
  const raw = await readFile(rootFile('.env.staging.example'), 'utf8');
  assert.match(raw, /ORBI_NEWS_ACTIVATION_PROFILE=DISABLED/);
  assert.match(raw, /ORBI_NEWS_RUNTIME_ENABLED=false/);
  assert.match(raw, /GEMINI_API_KEY=<vercel-secret>/);
  assert.match(raw, /RESEND_API_KEY=<vercel-secret>/);
  assert.match(raw, /CRON_SECRET=<vercel-secret-min-32-chars>/);
  assert.doesNotMatch(raw, /AIza[0-9A-Za-z_-]{20,}/);
  assert.doesNotMatch(raw, /re_[0-9A-Za-z]{20,}/);
});

test('staging source registry parses as four active authoritative HTTPS RSS sources', async () => {
  const raw = await readFile(
    new URL('../../docs/deployment/ORBI-NEWS-STAGING-SOURCES.json', import.meta.url),
    'utf8',
  );

  const entries = parseEnvironmentSourceRegistry({
    ORBI_NEWS_SOURCE_REGISTRY_JSON: raw,
  });

  assert.equal(entries.length, 4);

  assert.deepEqual(
    entries.map((entry) => ({
      domain: entry.domain,
      sourceType: entry.sourceType,
    })),
    [
      { domain: 'openai.com', sourceType: 'OFFICIAL' },
      { domain: 'blog.google', sourceType: 'OFFICIAL' },
      { domain: 'nvidianews.nvidia.com', sourceType: 'OFFICIAL' },
      { domain: 'energy.gov', sourceType: 'GOVERNMENT' },
    ],
  );

  for (const entry of entries) {
    assert.equal(entry.status, 'ACTIVE');
    assert.equal(entry.credibilityBand, 'AUTHORITATIVE');
    assert.ok(entry.feedUrl?.startsWith('https://'));
  }
});
