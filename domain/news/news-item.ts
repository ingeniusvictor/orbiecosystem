import type { ContentCategory, NewsStatus } from '../common/enums';
import type { IsoUtcDateTime, NewsItemId, OrganizationId, SourceId } from '../common/types';

export enum NewsOrigin {
  RSS = 'RSS',
  WEB_SEARCH = 'WEB_SEARCH',
  API = 'API',
  MANUAL = 'MANUAL',
  SOCIAL = 'SOCIAL',
  IMPORT = 'IMPORT',
}

export interface DiscoveryCandidate {
  readonly title: string;
  readonly url: string;
  readonly sourceName: string | null;
  readonly publishedAt: IsoUtcDateTime | null;
  readonly origin: NewsOrigin;
  readonly discoveredAt: IsoUtcDateTime;
}

export interface NewsItem {
  readonly id: NewsItemId;
  readonly organizationId: OrganizationId;
  readonly titleOriginal: string;
  readonly canonicalUrl: string;
  readonly canonicalUrlHash: string;
  readonly sourceId: SourceId;
  readonly author: string | null;
  readonly language: string;
  readonly publishedAt: IsoUtcDateTime | null;
  readonly detectedAt: IsoUtcDateTime;
  readonly eventDateCandidate: IsoUtcDateTime | null;
  readonly status: NewsStatus;
  readonly categories: readonly ContentCategory[];
  readonly rawSummary: string | null;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
}

export type IngestionResult =
  | { readonly kind: 'CREATED'; readonly newsItemId: NewsItemId }
  | { readonly kind: 'EXACT_DUPLICATE'; readonly existingNewsItemId: NewsItemId }
  | { readonly kind: 'REJECTED'; readonly reason: string };
