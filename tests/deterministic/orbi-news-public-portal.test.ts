import test from 'node:test';
import assert from 'node:assert/strict';

import { ContentCategory } from '../../domain/common/enums';
import {
  buildNewsArticlePath,
  buildNewsCategoryPath,
  parsePublicNewsRoute,
} from '../../src/news/routes';
import { getSeoRouteMetadata, seoPublicRoutes } from '../../src/seoMetadata';

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
