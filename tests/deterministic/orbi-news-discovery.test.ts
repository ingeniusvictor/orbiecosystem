import test from 'node:test';
import assert from 'node:assert/strict';

import { NewsOrigin } from '../../domain/news/news-item';
import {
  canonicalizeDiscoveryUrl,
  normalizeDiscoveryCandidate,
} from '../../domain/discovery/normalization';
import { deduplicateDiscoveryBatch } from '../../domain/discovery/duplicate-detector';

const discoveredAt = '2026-08-26T04:40:00.000Z' as never;

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
