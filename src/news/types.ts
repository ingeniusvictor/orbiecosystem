import type { ContentCategory } from '../../domain/common/enums';
export type {
  PublicNewsArticle,
  PublicNewsCard,
  PublicNewsFeed,
} from '../../domain/publications/public-news';
import type {
  PublicNewsArticle,
  PublicNewsFeed,
} from '../../domain/publications/public-news';

export interface PublicNewsRepository {
  listLatest(): Promise<PublicNewsFeed>;
  listByCategory(category: ContentCategory): Promise<PublicNewsFeed>;
  findBySlug(slug: string): Promise<PublicNewsArticle | null>;
}
