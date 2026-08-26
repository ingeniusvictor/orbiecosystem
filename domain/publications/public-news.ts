import type { ContentCategory } from '../common/enums';
import type { CanonicalStoryStatus } from '../editorial/canonical-story';
import type { PublicationChannel, PublicationStatus } from './publication';

export interface PublicNewsCard {
  readonly id: string;
  readonly slug: string;
  readonly headline: string;
  readonly dek: string;
  readonly category: ContentCategory;
  readonly publishedAt: string;
  readonly imageUrl: string | null;
  readonly imageAlt: string;
  readonly isBreaking: boolean;
}

export interface PublicNewsArticle extends PublicNewsCard {
  readonly sections: readonly {
    key: 'SUMMARY' | 'WHAT_HAPPENED' | 'WHY_IT_MATTERS' | 'PRACTICAL_IMPACT' | 'ORBI_LENS' | 'FUTURE_OUTLOOK';
    heading: string;
    body: string;
  }[];
  readonly sources: readonly {
    label: string;
    url: string;
    isPrimary: boolean;
  }[];
}

export interface PublicNewsFeed {
  readonly items: readonly PublicNewsCard[];
  readonly breaking: PublicNewsCard | null;
}

export interface PublishedNewsSourceRecord {
  readonly storyStatus: CanonicalStoryStatus;
  readonly publicationStatus: PublicationStatus;
  readonly publicationChannel: PublicationChannel;
  readonly article: PublicNewsArticle;
}

export interface PublicNewsReader {
  listRecords(): Promise<readonly PublishedNewsSourceRecord[]>;
}
