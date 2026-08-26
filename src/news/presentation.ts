import type { PublicNewsCard, PublicNewsFeed } from './types';

export const selectBreakingNewsCard = (feed: PublicNewsFeed): PublicNewsCard | null =>
  feed.breaking?.isBreaking === true ? feed.breaking : null;
