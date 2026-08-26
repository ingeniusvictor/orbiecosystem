import type { PublicNewsCard, PublicNewsFeed } from './types';

export const HOME_NEWS_LIMIT = 3;

export const selectHomeLatestNews = (
  feed: PublicNewsFeed,
  limit: number = HOME_NEWS_LIMIT,
): readonly PublicNewsCard[] => {
  const safeLimit = Number.isInteger(limit) && limit > 0
    ? Math.min(limit, HOME_NEWS_LIMIT)
    : HOME_NEWS_LIMIT;

  return feed.items.slice(0, safeLimit);
};
