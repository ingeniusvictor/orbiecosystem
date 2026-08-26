import { ContentCategory } from '../../domain/common/enums';
import type { PublicNewsArticle, PublicNewsCard, PublicNewsFeed, PublicNewsRepository } from './types';

export type PublicNewsFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const categoryValues = new Set(Object.values(ContentCategory));

const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPublicNewsCard = (value: unknown): value is PublicNewsCard => {
  if (!isObject(value)) return false;
  return (
    isString(value.id) &&
    isString(value.slug) &&
    isString(value.headline) &&
    isString(value.dek) &&
    isString(value.category) &&
    categoryValues.has(value.category as ContentCategory) &&
    isString(value.publishedAt) &&
    (value.imageUrl === null || isString(value.imageUrl)) &&
    isString(value.imageAlt) &&
    isBoolean(value.isBreaking)
  );
};

const isPublicNewsArticle = (value: unknown): value is PublicNewsArticle => {
  if (!isPublicNewsCard(value) || !isObject(value)) return false;
  if (!Array.isArray(value.sections) || !Array.isArray(value.sources)) return false;

  const validSectionKeys = new Set([
    'SUMMARY',
    'WHAT_HAPPENED',
    'WHY_IT_MATTERS',
    'PRACTICAL_IMPACT',
    'ORBI_LENS',
    'FUTURE_OUTLOOK',
  ]);

  return value.sections.every((section) =>
    isObject(section) &&
    isString(section.key) &&
    validSectionKeys.has(section.key) &&
    isString(section.heading) &&
    isString(section.body),
  ) && value.sources.every((source) =>
    isObject(source) &&
    isString(source.label) &&
    isString(source.url) &&
    isBoolean(source.isPrimary),
  );
};

const isPublicNewsFeed = (value: unknown): value is PublicNewsFeed =>
  isObject(value) &&
  Array.isArray(value.items) &&
  value.items.every(isPublicNewsCard) &&
  (value.breaking === null || isPublicNewsCard(value.breaking));

const fetchJson = async (fetcher: PublicNewsFetch, path: string): Promise<unknown> => {
  const response = await fetcher(path, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`PUBLIC_NEWS_HTTP_${response.status}`);
  }

  return response.json();
};

export const createHttpPublicNewsRepository = (
  fetcher: PublicNewsFetch,
): PublicNewsRepository => ({
  async listLatest(): Promise<PublicNewsFeed> {
    const payload = await fetchJson(fetcher, '/api/news');
    if (!isPublicNewsFeed(payload)) throw new Error('PUBLIC_NEWS_INVALID_FEED_RESPONSE');
    return payload;
  },

  async listByCategory(category: ContentCategory): Promise<PublicNewsFeed> {
    const payload = await fetchJson(fetcher, `/api/news/category/${category.toLowerCase()}`);
    if (!isPublicNewsFeed(payload)) throw new Error('PUBLIC_NEWS_INVALID_FEED_RESPONSE');
    return payload;
  },

  async findBySlug(slug: string): Promise<PublicNewsArticle | null> {
    const response = await fetcher(`/api/news/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`PUBLIC_NEWS_HTTP_${response.status}`);

    const payload: unknown = await response.json();
    if (!isPublicNewsArticle(payload)) throw new Error('PUBLIC_NEWS_INVALID_ARTICLE_RESPONSE');
    return payload;
  },
});

export const publicNewsRepository = createHttpPublicNewsRepository(fetch);
