import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
