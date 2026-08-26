import type { ContentCategory } from '../../domain/common/enums';

export const getCategoryAriaCurrent = (
  active: ContentCategory | null,
  category: ContentCategory | null,
): 'page' | undefined => (active === category ? 'page' : undefined);

export const getNewsRetryPath = (category: ContentCategory | null): string =>
  category ? `/news/category/${category.toLowerCase()}` : '/news';
