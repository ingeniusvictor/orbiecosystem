import test from 'node:test';
import assert from 'node:assert/strict';

import { createLiveArticleFetcher } from '../../server/news/live-article-fetcher';

const html = `<!doctype html><html><head><title>ORBI Test</title><meta name="description" content="Verified description"></head><body><script>bad()</script><h1>Headline</h1><p>${'Useful article text '.repeat(12)}</p></body></html>`;

test('NA-15 live article fetcher allows configured HTTPS host and extracts readable text', async () => {
  const fetcher = createLiveArticleFetcher({
    allowedHosts: ['example.com'],
    fetchImpl: async () => new Response(html, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }),
  });
  const result = await fetcher.fetchArticle('https://news.example.com/article');
  assert.equal(result.title, 'ORBI Test');
  assert.equal(result.description, 'Verified description');
  assert.ok(result.text.includes('Headline'));
  assert.equal(result.text.includes('bad()'), false);
});

test('NA-15 live article fetcher rejects non-allowlisted hosts before network access', async () => {
  let calls = 0;
  const fetcher = createLiveArticleFetcher({
    allowedHosts: ['example.com'],
    fetchImpl: async () => { calls += 1; return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } }); },
  });
  await assert.rejects(() => fetcher.fetchArticle('https://evil.example.net/article'), /HOST_NOT_ALLOWED/);
  assert.equal(calls, 0);
});

test('NA-15 live article fetcher rejects HTTP before network access', async () => {
  let calls = 0;
  const fetcher = createLiveArticleFetcher({
    allowedHosts: ['example.com'],
    fetchImpl: async () => { calls += 1; return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } }); },
  });
  await assert.rejects(() => fetcher.fetchArticle('http://example.com/article'), /HTTPS_REQUIRED/);
  assert.equal(calls, 0);
});
