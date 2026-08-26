import type { ContentCategory } from '../../domain/common/enums';
import type { PublicNewsArticle, PublicNewsFeed, PublicNewsRepository } from './types';

const emptyFeed = (): PublicNewsFeed => ({ items: [], breaking: null });

export const publicNewsRepository: PublicNewsRepository = {
  async listLatest(): Promise<PublicNewsFeed> {
    return emptyFeed();
  },

  async listByCategory(_category: ContentCategory): Promise<PublicNewsFeed> {
    return emptyFeed();
  },

  async findBySlug(_slug: string): Promise<PublicNewsArticle | null> {
    return null;
  },
};
