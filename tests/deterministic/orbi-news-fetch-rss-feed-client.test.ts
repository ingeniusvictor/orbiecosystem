import test from 'node:test';
import assert from 'node:assert/strict';
import { createFetchRssFeedClient, parseRssOrAtomDocument } from '../../server/discovery/fetch-rss-feed-client';

test('parses RSS items and dates deterministically', () => {
  const doc = parseRssOrAtomDocument(`<?xml version="1.0"?><rss><channel><title>Example News</title><item><title><![CDATA[AI update]]></title><link>https://example.com/a</link><pubDate>Thu, 27 Aug 2026 12:00:00 GMT</pubDate></item></channel></rss>`, 'https://example.com/rss.xml');
  assert.equal(doc.sourceName, 'Example News');
  assert.equal(doc.items.length, 1);
  assert.equal(doc.items[0].title, 'AI update');
  assert.equal(doc.items[0].publishedAt, '2026-08-27T12:00:00.000Z');
});

test('parses Atom href links', () => {
  const doc = parseRssOrAtomDocument(`<feed><title>Atom</title><entry><title>Launch</title><link href="https://example.com/launch"/><updated>2026-08-27T12:30:00Z</updated></entry></feed>`, 'https://example.com/atom.xml');
  assert.equal(doc.items[0].link, 'https://example.com/launch');
});

test('fetch client requires HTTPS and rejects oversized declared bodies', async () => {
  const client = createFetchRssFeedClient({
    maxBytes: 10,
    fetchImpl: (async () => new Response('01234567890', { status: 200, headers: { 'content-length': '11' } })) as typeof fetch,
  });
  await assert.rejects(() => client.fetchFeed('http://example.com/rss.xml'), /RSS_FETCH_HTTPS_REQUIRED/);
  await assert.rejects(() => client.fetchFeed('https://example.com/rss.xml'), /RSS_FETCH_BODY_TOO_LARGE/);
});
