import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory } from '../../domain/common/enums';
import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import {
  PublicationChannel,
  PublicationStatus,
  type PublicNewsArticle,
  type PublishedNewsSourceRecord,
} from '../../domain/publications';
import { createPublicNewsService } from '../../server/news/public-news-service';
import { getCategoryAriaCurrent, getNewsRetryPath } from '../../src/news/accessibility';
import { selectHomeLatestNews } from '../../src/news/home-presentation';
import { selectBreakingNewsCard } from '../../src/news/presentation';
import { createHttpPublicNewsRepository, type PublicNewsFetch } from '../../src/news/repository';
import { buildNewsArticlePath, buildNewsCategoryPath, parsePublicNewsRoute } from '../../src/news/routes';
import { buildNewsArticleSeoMetadata } from '../../src/seoMetadata';

const article = (overrides: Partial<PublicNewsArticle> = {}): PublicNewsArticle => ({
  id: 'story-ai-1',
  slug: 'verified-ai-platform-update',
  headline: 'Actualización verificada de una plataforma de IA',
  dek: 'ORBI News explica qué cambió, por qué importa y cuál es el impacto práctico.',
  category: ContentCategory.AI,
  publishedAt: '2026-08-26T10:30:00Z',
  imageUrl: 'https://assets.example.com/orbi-news-ai.webp',
  imageAlt: 'Visual editorial sobre una actualización de inteligencia artificial',
  isBreaking: true,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen verificado.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué pasó', body: 'Hechos verificados.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Importancia práctica.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto práctico', body: 'Impacto para usuarios.' },
    { key: 'ORBI_LENS', heading: 'Mirada ORBI', body: 'Perspectiva educativa ORBI.' },
  ],
  sources: [{ label: 'Fuente oficial', url: 'https://example.com/official', isPrimary: true }],
  ...overrides,
});

const publishedRecord = (
  newsArticle: PublicNewsArticle,
  overrides: Partial<PublishedNewsSourceRecord> = {},
): PublishedNewsSourceRecord => ({
  storyStatus: CanonicalStoryStatus.PUBLISHED,
  publicationStatus: PublicationStatus.PUBLISHED,
  publicationChannel: PublicationChannel.ORBI_WEB,
  article: newsArticle,
  ...overrides,
});

const createServiceFetch = (
  records: readonly PublishedNewsSourceRecord[],
): { fetcher: PublicNewsFetch; requestedPaths: string[] } => {
  const service = createPublicNewsService({ async listRecords() { return records; } });
  const requestedPaths: string[] = [];

  const jsonResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  const fetcher: PublicNewsFetch = async (input) => {
    const raw = typeof input === 'string' ? input : input.toString();
    const path = new URL(raw, 'https://orbi.test').pathname;
    requestedPaths.push(path);

    if (path === '/api/news') return jsonResponse(await service.listLatest());

    if (path.startsWith('/api/news/category/')) {
      const rawCategory = decodeURIComponent(path.slice('/api/news/category/'.length)).toUpperCase();
      if (!Object.values(ContentCategory).includes(rawCategory as ContentCategory)) {
        return jsonResponse({ error: 'NOT_FOUND' }, 404);
      }
      return jsonResponse(await service.listByCategory(rawCategory as ContentCategory));
    }

    if (path.startsWith('/api/news/')) {
      const slug = decodeURIComponent(path.slice('/api/news/'.length));
      const found = await service.findBySlug(slug);
      return found ? jsonResponse(found) : jsonResponse({ error: 'NOT_FOUND' }, 404);
    }

    return jsonResponse({ error: 'NOT_FOUND' }, 404);
  };

  return { fetcher, requestedPaths };
};

test('full public portal path exposes only dual-published ORBI_WEB stories end to end', async () => {
  const visible = article();
  const draft = article({ id: 'draft', slug: 'draft-story', isBreaking: false });
  const socialOnly = article({ id: 'social', slug: 'social-only', isBreaking: false });

  const records: readonly PublishedNewsSourceRecord[] = [
    publishedRecord(visible),
    publishedRecord(draft, { storyStatus: CanonicalStoryStatus.DRAFT_READY }),
    publishedRecord(socialOnly, { publicationChannel: PublicationChannel.FACEBOOK }),
  ];

  const { fetcher } = createServiceFetch(records);
  const repository = createHttpPublicNewsRepository(fetcher);
  const feed = await repository.listLatest();

  assert.deepEqual(feed.items.map((item) => item.id), [visible.id]);
  assert.equal(selectBreakingNewsCard(feed)?.id, visible.id);
  assert.equal(await repository.findBySlug(draft.slug), null);
  assert.equal(await repository.findBySlug(socialOnly.slug), null);
});

test('full public portal preserves category, route, SEO and home-preview consistency', async () => {
  const newest = article();
  const solar = article({
    id: 'story-solar-1',
    slug: 'verified-solar-update',
    headline: 'Actualización verificada de energía solar',
    category: ContentCategory.SOLAR,
    publishedAt: '2026-08-26T09:30:00Z',
    isBreaking: false,
  });

  const { fetcher, requestedPaths } = createServiceFetch([
    publishedRecord(solar),
    publishedRecord(newest),
  ]);
  const repository = createHttpPublicNewsRepository(fetcher);

  const feed = await repository.listLatest();
  const home = selectHomeLatestNews(feed);
  assert.deepEqual(home.map((item) => item.id), [newest.id, solar.id]);

  const categoryPath = buildNewsCategoryPath(ContentCategory.SOLAR);
  assert.deepEqual(parsePublicNewsRoute(categoryPath), { kind: 'CATEGORY', category: ContentCategory.SOLAR });
  const solarFeed = await repository.listByCategory(ContentCategory.SOLAR);
  assert.deepEqual(solarFeed.items.map((item) => item.id), [solar.id]);

  const articlePath = buildNewsArticlePath(newest.slug);
  assert.deepEqual(parsePublicNewsRoute(articlePath), { kind: 'ARTICLE', slug: newest.slug });
  const loaded = await repository.findBySlug(newest.slug);
  assert.ok(loaded);

  const seo = buildNewsArticleSeoMetadata(loaded);
  assert.equal(seo.canonical, `https://orbiecosystem.vercel.app${articlePath}`);
  assert.equal(seo.openGraph.title, loaded.headline);
  assert.equal(seo.description, loaded.dek);
  assert.equal(seo.structuredData[0]['@type'], 'NewsArticle');
  assert.equal(seo.structuredData[0].datePublished, loaded.publishedAt);

  assert.ok(requestedPaths.includes('/api/news'));
  assert.ok(requestedPaths.includes('/api/news/category/solar'));
  assert.ok(requestedPaths.includes(`/api/news/${newest.slug}`));
});

test('full public portal accessibility helpers stay aligned with canonical public routes', () => {
  assert.equal(getCategoryAriaCurrent(ContentCategory.AI, ContentCategory.AI), 'page');
  assert.equal(getCategoryAriaCurrent(ContentCategory.AI, ContentCategory.SOLAR), undefined);
  assert.equal(getCategoryAriaCurrent(null, null), 'page');
  assert.equal(getNewsRetryPath(null), '/news');
  assert.equal(getNewsRetryPath(ContentCategory.SOLAR), '/news/category/solar');
});

test('full public portal does not promote a non-breaking published story to breaking', async () => {
  const ordinary = article({ isBreaking: false });
  const { fetcher } = createServiceFetch([publishedRecord(ordinary)]);
  const repository = createHttpPublicNewsRepository(fetcher);
  const feed = await repository.listLatest();

  assert.equal(feed.breaking, null);
  assert.equal(selectBreakingNewsCard(feed), null);
});
