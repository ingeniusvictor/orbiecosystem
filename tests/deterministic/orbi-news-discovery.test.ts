import test from 'node:test';
import assert from 'node:assert/strict';

import { NewsOrigin } from '../../domain/news/news-item';
import { SourceCredibilityBand, SourceType } from '../../domain/common/enums';
import {
  canonicalizeDiscoveryUrl,
  normalizeDiscoveryCandidate,
} from '../../domain/discovery/normalization';
import { deduplicateDiscoveryBatch } from '../../domain/discovery/duplicate-detector';
import { RssDiscoveryProvider } from '../../domain/discovery/rss-provider';
import { WebSearchDiscoveryProvider } from '../../domain/discovery/web-search-provider';
import { DiscoveryProviderStatus } from '../../domain/discovery/provider';
import { SourceRegistryStatus } from '../../domain/discovery/source-registry';

const discoveredAt = '2026-08-26T04:40:00.000Z' as never;
const organizationId = 'org-1' as never;
const sourceId = 'source-1' as never;

const clock = { now: () => discoveredAt };

const source = {
  id: sourceId,
  organizationId,
  name: 'Example Tech',
  domain: 'example.com',
  homepageUrl: 'https://example.com',
  feedUrl: 'https://example.com/rss.xml',
  sourceType: SourceType.PRIMARY_MEDIA,
  credibilityBand: SourceCredibilityBand.HIGH,
  allowedOrigins: [NewsOrigin.RSS],
  categories: [],
  status: SourceRegistryStatus.ACTIVE,
  isPrimaryPreferred: false,
  notes: null,
  createdAt: discoveredAt,
  updatedAt: discoveredAt,
};

const registry = {
  findById: async () => source,
  findByDomain: async () => source,
  listActive: async () => [source],
};

test('canonicalization strips tracking parameters and fragments', () => {
  const canonical = canonicalizeDiscoveryUrl(
    'https://Example.com/news/item/?utm_source=facebook&fbclid=abc&id=42#section',
  );

  assert.equal(canonical, 'https://example.com/news/item?id=42');
});

test('canonicalization produces stable query ordering', () => {
  const a = canonicalizeDiscoveryUrl('https://example.com/story?b=2&a=1');
  const b = canonicalizeDiscoveryUrl('https://example.com/story?a=1&b=2');
  assert.equal(a, b);
});

test('candidate normalization collapses title whitespace', () => {
  const candidate = normalizeDiscoveryCandidate({
    title: '  NVIDIA   releases   a model  ',
    url: 'https://example.com/story',
    origin: NewsOrigin.WEB_SEARCH,
    discoveredAt,
  });

  assert.equal(candidate.title, 'NVIDIA releases a model');
  assert.equal(candidate.normalizedTitle, 'NVIDIA releases a model');
});

test('candidate normalization rejects empty titles', () => {
  assert.throws(
    () =>
      normalizeDiscoveryCandidate({
        title: '   ',
        url: 'https://example.com/story',
        origin: NewsOrigin.RSS,
        discoveredAt,
      }),
    /DISCOVERY_TITLE_REQUIRED/,
  );
});

test('batch deduplication treats tracking variants as the same article', () => {
  const first = normalizeDiscoveryCandidate({
    title: 'Story A',
    url: 'https://example.com/story?id=7&utm_source=x',
    origin: NewsOrigin.RSS,
    discoveredAt,
  });
  const second = normalizeDiscoveryCandidate({
    title: 'Story A duplicate',
    url: 'https://EXAMPLE.com/story/?fbclid=abc&id=7#top',
    origin: NewsOrigin.WEB_SEARCH,
    discoveredAt,
  });

  const result = deduplicateDiscoveryBatch([first, second]);
  assert.equal(result.unique.length, 1);
  assert.equal(result.duplicates.length, 1);
});

test('RSS provider reads eligible registry sources and respects maxCandidates', async () => {
  const provider = new RssDiscoveryProvider(
    registry,
    {
      fetchFeed: async () => ({
        feedUrl: source.feedUrl as string,
        sourceName: source.name,
        items: [
          { title: 'First', link: 'https://example.com/1', publishedAt: discoveredAt },
          { title: 'Second', link: 'https://example.com/2', publishedAt: discoveredAt },
        ],
      }),
    },
    clock,
  );

  const result = await provider.discover({
    organizationId,
    origin: NewsOrigin.RSS,
    sourceIds: [sourceId],
    keywords: [],
    from: null,
    to: null,
    maxCandidates: 1,
  });

  assert.equal(result.status, DiscoveryProviderStatus.AVAILABLE);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0]?.origin, NewsOrigin.RSS);
});

test('RSS provider degrades when one source fetch fails', async () => {
  const provider = new RssDiscoveryProvider(
    registry,
    { fetchFeed: async () => { throw new Error('network'); } },
    clock,
  );

  const result = await provider.discover({
    organizationId,
    origin: NewsOrigin.RSS,
    sourceIds: [sourceId],
    keywords: [],
    from: null,
    to: null,
    maxCandidates: 10,
  });

  assert.equal(result.status, DiscoveryProviderStatus.DEGRADED);
  assert.match(result.warnings[0] ?? '', /RSS_SOURCE_FETCH_FAILED/);
});

test('web search provider stays unavailable when client is not configured', async () => {
  const provider = new WebSearchDiscoveryProvider(
    {
      id: 'search-client',
      getStatus: async () => DiscoveryProviderStatus.NOT_CONFIGURED,
      search: async () => ({ items: [], warnings: [] }),
    },
    clock,
  );

  const result = await provider.discover({
    organizationId,
    origin: NewsOrigin.WEB_SEARCH,
    sourceIds: [],
    keywords: ['AI'],
    from: null,
    to: null,
    maxCandidates: 5,
  });

  assert.equal(result.status, DiscoveryProviderStatus.NOT_CONFIGURED);
  assert.equal(result.candidates.length, 0);
});

test('web search provider maps external results into discovery candidates', async () => {
  const provider = new WebSearchDiscoveryProvider(
    {
      id: 'search-client',
      getStatus: async () => DiscoveryProviderStatus.AVAILABLE,
      search: async () => ({
        items: [{
          title: 'New AI model',
          url: 'https://example.com/ai',
          sourceName: 'Example Tech',
          publishedAt: discoveredAt,
        }],
        warnings: [],
      }),
    },
    clock,
  );

  const result = await provider.discover({
    organizationId,
    origin: NewsOrigin.WEB_SEARCH,
    sourceIds: [],
    keywords: ['AI'],
    from: null,
    to: null,
    maxCandidates: 5,
  });

  assert.equal(result.status, DiscoveryProviderStatus.AVAILABLE);
  assert.equal(result.candidates[0]?.origin, NewsOrigin.WEB_SEARCH);
});
