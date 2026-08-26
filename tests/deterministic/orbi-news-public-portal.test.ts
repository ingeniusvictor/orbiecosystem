import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory } from '../../domain/common/enums';
import { getCategoryAriaCurrent, getNewsRetryPath } from '../../src/news/accessibility';
import { HOME_NEWS_LIMIT, selectHomeLatestNews } from '../../src/news/home-presentation';
import { selectBreakingNewsCard } from '../../src/news/presentation';
import {
  buildNewsArticlePath,
  buildNewsCategoryPath,
  parsePublicNewsRoute,
} from '../../src/news/routes';
import type { PublicNewsArticle, PublicNewsFeed } from '../../src/news/types';
import {
  buildNewsArticleSeoMetadata,
  getSeoRouteMetadata,
  seoPublicRoutes,
} from '../../src/seoMetadata';

const publishedArticle = (): PublicNewsArticle => ({
  id: 'story-1',
  slug: 'openai-announces-verified-model-update',
  headline: 'OpenAI anuncia una actualización verificada del modelo',
  dek: 'ORBI News explica qué cambió, por qué importa y cuál es su impacto práctico.',
  category: ContentCategory.AI,
  publishedAt: '2026-08-26T10:30:00Z',
  imageUrl: 'https://assets.example.com/orbi-news-ai.webp',
  imageAlt: 'Visual editorial de una actualización de inteligencia artificial',
  isBreaking: true,
  sections: [
    { key: 'SUMMARY', heading: 'Resumen', body: 'Resumen verificado.' },
    { key: 'WHAT_HAPPENED', heading: 'Qué pasó', body: 'Hechos verificados.' },
    { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Importancia.' },
    { key: 'PRACTICAL_IMPACT', heading: 'Impacto práctico', body: 'Impacto.' },
    { key: 'ORBI_LENS', heading: 'Mirada ORBI', body: 'Perspectiva ORBI.' },
  ],
  sources: [
    { label: 'OpenAI', url: 'https://example.com/primary', isPrimary: true },
  ],
});

test('news index route is deterministic with optional trailing slash', () => {
  assert.deepEqual(parsePublicNewsRoute('/news'), { kind: 'INDEX' });
  assert.deepEqual(parsePublicNewsRoute('/news/'), { kind: 'INDEX' });
});

test('all canonical content categories map to public category routes', () => {
  for (const category of Object.values(ContentCategory)) {
    const path = buildNewsCategoryPath(category);
    assert.deepEqual(parsePublicNewsRoute(path), { kind: 'CATEGORY', category });
  }
});

test('unknown news category fails closed', () => {
  assert.deepEqual(parsePublicNewsRoute('/news/category/not-a-category'), { kind: 'NOT_FOUND' });
});

test('valid canonical article slug maps to article route', () => {
  const slug = 'openai-announces-verified-model-update';
  assert.equal(buildNewsArticlePath(slug), `/news/${slug}`);
  assert.deepEqual(parsePublicNewsRoute(`/news/${slug}`), { kind: 'ARTICLE', slug });
});

test('invalid or nested article paths fail closed', () => {
  assert.deepEqual(parsePublicNewsRoute('/news/Bad Slug'), { kind: 'NOT_FOUND' });
  assert.deepEqual(parsePublicNewsRoute('/news/article/extra'), { kind: 'NOT_FOUND' });
});

test('ORBI News has canonical base SEO metadata', () => {
  const metadata = getSeoRouteMetadata('news');
  assert.equal(metadata.lang, 'es');
  assert.equal(metadata.canonical, 'https://orbiecosystem.vercel.app/news');
  assert.equal(metadata.openGraph.url, metadata.canonical);
  assert.ok(metadata.title.includes('ORBI News'));
  assert.ok(seoPublicRoutes.includes(metadata.canonical as (typeof seoPublicRoutes)[number]));
});

test('category navigation exposes aria-current only for the active destination', () => {
  assert.equal(getCategoryAriaCurrent(null, null), 'page');
  assert.equal(getCategoryAriaCurrent(ContentCategory.AI, ContentCategory.AI), 'page');
  assert.equal(getCategoryAriaCurrent(ContentCategory.AI, ContentCategory.TECH), undefined);
  assert.equal(getCategoryAriaCurrent(ContentCategory.AI, null), undefined);
});

test('news retry path preserves the current category context', () => {
  assert.equal(getNewsRetryPath(null), '/news');
  assert.equal(getNewsRetryPath(ContentCategory.CYBERSECURITY), buildNewsCategoryPath(ContentCategory.CYBERSECURITY));
});

test('breaking banner selector requires explicit isBreaking true', () => {
  const article = publishedArticle();
  const validFeed: PublicNewsFeed = { items: [article], breaking: article };
  assert.equal(selectBreakingNewsCard(validFeed)?.id, article.id);

  const malformedBreaking = { ...article, isBreaking: false };
  const malformedFeed: PublicNewsFeed = { items: [malformedBreaking], breaking: malformedBreaking };
  assert.equal(selectBreakingNewsCard(malformedFeed), null);
});

test('home latest news is capped at three published cards and preserves API ordering', () => {
  const base = publishedArticle();
  const items = [1, 2, 3, 4, 5].map((index) => ({
    ...base,
    id: `story-${index}`,
    slug: `story-${index}`,
    headline: `Story ${index}`,
  }));
  const feed: PublicNewsFeed = { items, breaking: null };

  const selected = selectHomeLatestNews(feed);
  assert.equal(HOME_NEWS_LIMIT, 3);
  assert.deepEqual(selected.map((item) => item.id), ['story-1', 'story-2', 'story-3']);
});

test('home latest news cannot be expanded beyond its editorial maximum', () => {
  const base = publishedArticle();
  const items = [1, 2, 3, 4].map((index) => ({ ...base, id: `story-${index}`, slug: `story-${index}` }));
  const feed: PublicNewsFeed = { items, breaking: null };

  assert.equal(selectHomeLatestNews(feed, 99).length, HOME_NEWS_LIMIT);
  assert.equal(selectHomeLatestNews(feed, 1).length, 1);
});

test('dynamic article SEO is derived from the published PublicNewsArticle', () => {
  const article = publishedArticle();
  const metadata = buildNewsArticleSeoMetadata(article);

  assert.equal(metadata.canonical, `https://orbiecosystem.vercel.app/news/${article.slug}`);
  assert.equal(metadata.description, article.dek);
  assert.equal(metadata.openGraph.title, article.headline);
  assert.equal(metadata.openGraph.description, article.dek);
  assert.equal(metadata.openGraph.type, 'article');
  assert.equal(metadata.openGraph.image, article.imageUrl);
  assert.equal(metadata.twitter.image, article.imageUrl);

  const newsArticle = metadata.structuredData[0];
  assert.equal(newsArticle['@type'], 'NewsArticle');
  assert.equal(newsArticle.headline, article.headline);
  assert.equal(newsArticle.description, article.dek);
  assert.equal(newsArticle.datePublished, article.publishedAt);
  assert.equal(newsArticle.articleSection, 'AI');
  assert.deepEqual(newsArticle.image, [article.imageUrl]);
});

test('dynamic article SEO omits image when the published article has no image asset', () => {
  const article = { ...publishedArticle(), imageUrl: null };
  const metadata = buildNewsArticleSeoMetadata(article);

  assert.equal(metadata.openGraph.image, undefined);
  assert.equal(metadata.twitter.image, undefined);
  assert.equal('image' in metadata.structuredData[0], false);
});
