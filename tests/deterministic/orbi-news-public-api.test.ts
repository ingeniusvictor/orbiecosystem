import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory } from '../../domain/common/enums';
import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import {
  PublicationChannel,
  PublicationStatus,
  type PublicNewsArticle,
  type PublicNewsReader,
  type PublishedNewsSourceRecord,
} from '../../domain/publications';
import { createPublicNewsService } from '../../server/news/public-news-service';
import { createHttpPublicNewsRepository, type PublicNewsFetch } from '../../src/news/repository';

const article = (
  slug: string,
  publishedAt: string,
  overrides: Partial<PublicNewsArticle> = {},
): PublicNewsArticle => ({
  id: `story-${slug}`,
  slug,
  headline: `Headline ${slug}`,
  dek: `Dek ${slug}`,
  category: ContentCategory.AI,
  publishedAt,
  imageUrl: null,
  imageAlt: `Visual ${slug}`,
  isBreaking: false,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen verificado.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué pasó', body: 'Hechos verificados.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Importancia.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto', body: 'Impacto práctico.' },
    { key: 'ORBI_LENS', heading: 'ORBI', body: 'Mirada ORBI.' },
  ],
  sources: [{ label: 'Fuente primaria', url: 'https://example.com/source', isPrimary: true }],
  ...overrides,
});

const record = (
  item: PublicNewsArticle,
  overrides: Partial<PublishedNewsSourceRecord> = {},
): PublishedNewsSourceRecord => ({
  storyStatus: CanonicalStoryStatus.PUBLISHED,
  publicationStatus: PublicationStatus.PUBLISHED,
  publicationChannel: PublicationChannel.ORBI_WEB,
  article: item,
  ...overrides,
});

const reader = (records: readonly PublishedNewsSourceRecord[]): PublicNewsReader => ({
  async listRecords() {
    return records;
  },
});

test('public news service exposes only dual-published ORBI web stories', async () => {
  const visible = article('visible-story', '2026-08-26T06:30:00Z');
  const draftStory = article('draft-story', '2026-08-26T06:31:00Z');
  const pendingPublication = article('pending-publication', '2026-08-26T06:32:00Z');
  const socialOnly = article('social-only', '2026-08-26T06:33:00Z');

  const service = createPublicNewsService(reader([
    record(visible),
    record(draftStory, { storyStatus: CanonicalStoryStatus.APPROVED }),
    record(pendingPublication, { publicationStatus: PublicationStatus.READY }),
    record(socialOnly, { publicationChannel: PublicationChannel.FACEBOOK }),
  ]));

  const feed = await service.listLatest();
  assert.deepEqual(feed.items.map((item) => item.slug), ['visible-story']);
});

test('public news service sorts newest first and selects only a published breaking story', async () => {
  const olderBreaking = article('older-breaking', '2026-08-26T06:00:00Z', { isBreaking: true });
  const newest = article('newest', '2026-08-26T07:00:00Z');
  const service = createPublicNewsService(reader([record(olderBreaking), record(newest)]));

  const feed = await service.listLatest();
  assert.deepEqual(feed.items.map((item) => item.slug), ['newest', 'older-breaking']);
  assert.equal(feed.breaking?.slug, 'older-breaking');
});

test('public news service filters categories and hides unpublished slug lookups', async () => {
  const ai = article('ai-story', '2026-08-26T06:00:00Z');
  const solar = article('solar-story', '2026-08-26T06:05:00Z', { category: ContentCategory.SOLAR });
  const hidden = article('hidden-story', '2026-08-26T06:10:00Z');
  const service = createPublicNewsService(reader([
    record(ai),
    record(solar),
    record(hidden, { publicationStatus: PublicationStatus.APPROVED }),
  ]));

  const solarFeed = await service.listByCategory(ContentCategory.SOLAR);
  assert.deepEqual(solarFeed.items.map((item) => item.slug), ['solar-story']);
  assert.equal((await service.findBySlug('ai-story'))?.slug, 'ai-story');
  assert.equal(await service.findBySlug('hidden-story'), null);
});

const response = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

test('HTTP public repository uses canonical API endpoints', async () => {
  const calls: string[] = [];
  const item = article('api-story', '2026-08-26T06:30:00Z');
  const fetcher: PublicNewsFetch = async (input) => {
    const path = String(input);
    calls.push(path);
    if (path === '/api/news') return response({ items: [item], breaking: null });
    if (path === '/api/news/category/ai') return response({ items: [item], breaking: null });
    if (path === '/api/news/api-story') return response(item);
    return response({ error: 'not found' }, 404);
  };

  const repository = createHttpPublicNewsRepository(fetcher);
  assert.equal((await repository.listLatest()).items[0]?.slug, 'api-story');
  assert.equal((await repository.listByCategory(ContentCategory.AI)).items[0]?.slug, 'api-story');
  assert.equal((await repository.findBySlug('api-story'))?.slug, 'api-story');
  assert.deepEqual(calls, ['/api/news', '/api/news/category/ai', '/api/news/api-story']);
});

test('HTTP public repository maps article 404 to null and rejects malformed payloads', async () => {
  const notFound = createHttpPublicNewsRepository(async () => response({ error: 'missing' }, 404));
  assert.equal(await notFound.findBySlug('missing-story'), null);

  const malformed = createHttpPublicNewsRepository(async () => response({ items: 'not-an-array', breaking: null }));
  await assert.rejects(() => malformed.listLatest(), /PUBLIC_NEWS_INVALID_FEED_RESPONSE/);
});
