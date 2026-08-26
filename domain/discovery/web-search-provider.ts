import type { IsoUtcDateTime } from '../common/types';
import { NewsOrigin } from '../news/news-item';
import type { DiscoveryProvider, DiscoveryProviderResult, DiscoveryQuery } from './provider';
import { DiscoveryProviderStatus } from './provider';
import type { Clock } from './rss-provider';

export interface WebSearchResultItem {
  readonly title: string;
  readonly url: string;
  readonly sourceName: string | null;
  readonly publishedAt: IsoUtcDateTime | null;
}

export interface WebSearchClientResult {
  readonly items: readonly WebSearchResultItem[];
  readonly warnings: readonly string[];
}

export interface WebSearchClient {
  readonly id: string;
  getStatus(): Promise<DiscoveryProviderStatus>;
  search(input: {
    readonly keywords: readonly string[];
    readonly from: IsoUtcDateTime | null;
    readonly to: IsoUtcDateTime | null;
    readonly maxResults: number;
  }): Promise<WebSearchClientResult>;
}

export class WebSearchDiscoveryProvider implements DiscoveryProvider {
  readonly id = 'web-search-v1';
  readonly origin = NewsOrigin.WEB_SEARCH;

  constructor(
    private readonly client: WebSearchClient,
    private readonly clock: Clock,
  ) {}

  getStatus(): Promise<DiscoveryProviderStatus> {
    return this.client.getStatus();
  }

  async discover(query: DiscoveryQuery): Promise<DiscoveryProviderResult> {
    const startedAt = this.clock.now();

    if (query.origin !== NewsOrigin.WEB_SEARCH) {
      return {
        providerId: this.id,
        origin: this.origin,
        status: DiscoveryProviderStatus.UNAVAILABLE,
        candidates: [],
        startedAt,
        completedAt: this.clock.now(),
        warnings: ['WEB_SEARCH_PROVIDER_ORIGIN_MISMATCH'],
      };
    }

    const status = await this.client.getStatus();
    if (status === DiscoveryProviderStatus.NOT_CONFIGURED || status === DiscoveryProviderStatus.UNAVAILABLE) {
      return {
        providerId: this.id,
        origin: this.origin,
        status,
        candidates: [],
        startedAt,
        completedAt: this.clock.now(),
        warnings: ['WEB_SEARCH_CLIENT_NOT_AVAILABLE'],
      };
    }

    const result = await this.client.search({
      keywords: query.keywords,
      from: query.from,
      to: query.to,
      maxResults: query.maxCandidates,
    });

    return {
      providerId: this.id,
      origin: this.origin,
      status: result.warnings.length > 0 ? DiscoveryProviderStatus.DEGRADED : status,
      candidates: result.items.slice(0, query.maxCandidates).map((item) => ({
        title: item.title,
        url: item.url,
        sourceName: item.sourceName,
        publishedAt: item.publishedAt,
        origin: NewsOrigin.WEB_SEARCH,
        discoveredAt: this.clock.now(),
      })),
      startedAt,
      completedAt: this.clock.now(),
      warnings: result.warnings,
    };
  }
}
