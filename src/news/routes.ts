import { ContentCategory } from '../../domain/common/enums';

export type PublicNewsRoute =
  | { readonly kind: 'INDEX' }
  | { readonly kind: 'CATEGORY'; readonly category: ContentCategory }
  | { readonly kind: 'ARTICLE'; readonly slug: string }
  | { readonly kind: 'NOT_FOUND' };

const normalizePath = (pathname: string): string => pathname.replace(/\/+$/, '') || '/';

const categoryBySegment = new Map<string, ContentCategory>(
  Object.values(ContentCategory).map((category) => [category.toLowerCase(), category]),
);

export const parsePublicNewsRoute = (pathname: string): PublicNewsRoute => {
  const normalized = normalizePath(pathname);
  if (normalized === '/news') return { kind: 'INDEX' };

  const categoryMatch = normalized.match(/^\/news\/category\/([^/]+)$/);
  if (categoryMatch) {
    const category = categoryBySegment.get(decodeURIComponent(categoryMatch[1]).toLowerCase());
    return category ? { kind: 'CATEGORY', category } : { kind: 'NOT_FOUND' };
  }

  const articleMatch = normalized.match(/^\/news\/([^/]+)$/);
  if (articleMatch) {
    const slug = decodeURIComponent(articleMatch[1]).trim();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
      ? { kind: 'ARTICLE', slug }
      : { kind: 'NOT_FOUND' };
  }

  return { kind: 'NOT_FOUND' };
};

export const buildNewsCategoryPath = (category: ContentCategory): string =>
  `/news/category/${category.toLowerCase()}`;

export const buildNewsArticlePath = (slug: string): string => `/news/${slug}`;
