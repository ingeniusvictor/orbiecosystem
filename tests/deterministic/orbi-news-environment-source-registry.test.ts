import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnvironmentSourceRegistry, createInMemorySourceRegistry } from '../../server/discovery/environment-source-registry';

const entry = {
  id: 'source-openai',
  organizationId: 'orbi-ecosystem',
  name: 'OpenAI',
  domain: 'openai.com',
  homepageUrl: 'https://openai.com/',
  feedUrl: 'https://openai.com/news/rss.xml',
  sourceType: 'OFFICIAL',
  credibilityBand: 'HIGH',
  allowedOrigins: ['RSS'],
  categories: ['AI'],
  status: 'ACTIVE',
  isPrimaryPreferred: true,
  notes: null,
  createdAt: '2026-08-27T00:00:00.000Z',
  updatedAt: '2026-08-27T00:00:00.000Z',
};

test('source registry is empty when not configured', () => {
  assert.deepEqual(parseEnvironmentSourceRegistry({}), []);
});

test('valid HTTPS source registry entry is parsed and queryable', async () => {
  const entries = parseEnvironmentSourceRegistry({ ORBI_NEWS_SOURCE_REGISTRY_JSON: JSON.stringify([entry]) });
  assert.equal(entries.length, 1);
  const registry = createInMemorySourceRegistry(entries);
  assert.equal((await registry.findByDomain('OPENAI.COM'))?.id, 'source-openai');
  assert.equal((await registry.listActive()).length, 1);
});

test('duplicate ids and insecure URLs fail closed', () => {
  assert.throws(() => parseEnvironmentSourceRegistry({ ORBI_NEWS_SOURCE_REGISTRY_JSON: JSON.stringify([entry, entry]) }), /SOURCE_REGISTRY_DUPLICATE_ID/);
  assert.throws(() => parseEnvironmentSourceRegistry({ ORBI_NEWS_SOURCE_REGISTRY_JSON: JSON.stringify([{ ...entry, homepageUrl: 'http://openai.com/' }]) }), /HTTPS_REQUIRED/);
});
