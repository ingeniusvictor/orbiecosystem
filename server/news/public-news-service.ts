import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story.js';
import { PublicationChannel, PublicationStatus } from '../../domain/publications/publication.js';
import type {
  PublicNewsArticle,
  PublicNewsFeed,
  PublicNewsReader,
  PublishedNewsSourceRecord,
} from '../../domain/publications/public-news.js';
import type { ContentCategory } from '../../domain/common/enums.js';

const isPublicWebPublication = (record: PublishedNewsSourceRecord): boolean =>
  record.storyStatus === CanonicalStoryStatus.PUBLISHED &&
  record.publicationStatus === PublicationStatus.PUBLISHED &&
  record.publicationChannel === PublicationChannel.ORBI_WEB;

const toSortedPublishedArticles = (
  records: readonly PublishedNewsSourceRecord[],
): readonly PublicNewsArticle[] =>
  records
    .filter(isPublicWebPublication)
    .map((record) => record.article)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

const toFeed = (articles: readonly PublicNewsArticle[]): PublicNewsFeed => ({
  items: articles,
  breaking: articles.find((article) => article.isBreaking) ?? null,
});

export interface PublicNewsService {
  listLatest(): Promise<PublicNewsFeed>;
  listByCategory(category: ContentCategory): Promise<PublicNewsFeed>;
  findBySlug(slug: string): Promise<PublicNewsArticle | null>;
}

export const createPublicNewsService = (reader: PublicNewsReader): PublicNewsService => ({
  async listLatest(): Promise<PublicNewsFeed> {
    return toFeed(toSortedPublishedArticles(await reader.listRecords()));
  },

  async listByCategory(category: ContentCategory): Promise<PublicNewsFeed> {
    const published = toSortedPublishedArticles(await reader.listRecords())
      .filter((article) => article.category === category);
    return toFeed(published);
  },

  async findBySlug(slug: string): Promise<PublicNewsArticle | null> {
    return toSortedPublishedArticles(await reader.listRecords())
      .find((article) => article.slug === slug) ?? null;
  },
});

export const emptyPublicNewsReader: PublicNewsReader = {
  async listRecords(): Promise<readonly PublishedNewsSourceRecord[]> {
    return [];
  },
};
