import type { IsoUtcDateTime, SourceId } from '../common/types';
import { NewsOrigin } from '../news/news-item';
import type { DiscoveryProvider, DiscoveryProviderResult, DiscoveryQuery } from './provider';
import { DiscoveryProviderStatus } from './provider';
import type { SourceRegistryEntry, SourceRegistryRepository } from './source-registry';
import { isSourceEligibleForDiscovery } from './source-registry';

export interface RssFeedItem {
  readonly title: string;
  readonly link: string;
  readonly publishedAt: IsoUtcDateTime | null;
}

export interface RssFeedDocument {
  readonly feedUrl: string;
  readonly sourceName: string | null;
  readonly items: readonly RssFeedItem[];
}

export interface RssFeedClient {
  fetchFeed(feedUrl: string): Promise<RssFeedDocument>;
}

export interface Clock {
  now(): IsoUtcDateTime;
}

const filterByTimeWindow = (
  publishedAt: IsoUtcDateTime | null,
  from: IsoUtcDateTime | null,
  to: IsoUtcDateTime | null,
): boolean => {
  if (publishedAt === null) return true;
  const value = Date.parse(publishedAt);
  if (!Number.isFinite(value)) return false;
  if (from !== null && value < Date.parse(from)) return false;
  if (to !== null && value > Date.parse(to)) return false;
  return true;
};

const loadRequestedSources = async (
  registry: SourceRegistryRepository,
  sourceIds: readonly SourceId[],
): Promise<readonly SourceRegistryEntry[]> => {
  const resolved = await Promise.all(sourceIds.map((sourceId) => registry.findById(sourceId)));
  return resolved.filter((source): source is SourceRegistryEntry => source !== null);
};

export class RssDiscoveryProvider implements DiscoveryProvider {
  readonly id = 'rss-registry-v1';
  readonly origin = NewsOrigin.RSS;

  constructor(
    private readonly registry: SourceRegistryRepository,
    private readonly feedClient: RssFeedClient,
    private readonly clock: Clock,
  ) {}

  async getStatus(): Promise<DiscoveryProviderStatus> {
    const active = await this.registry.listActive();
    const eligible = active.some(
      (source) => isSourceEligibleForDiscovery(source, NewsOrigin.RSS) && source.feedUrl !== null,
    );
    return eligible ? DiscoveryProviderStatus.AVAILABLE : DiscoveryProviderStatus.NOT_CONFIGURED;
  }

  async discover(query: DiscoveryQuery): Promise<DiscoveryProviderResult> {
    const startedAt = this.clock.now();
    const warnings: string[] = [];

    if (query.origin !== NewsOrigin.RSS) {
      return {
        providerId: this.id,
        origin: this.origin,
        status: DiscoveryProviderStatus.UNAVAILABLE,
        candidates: [],
        startedAt,
        completedAt: this.clock.now(),
        warnings: ['RSS_PROVIDER_ORIGIN_MISMATCH'],
      };
    }

    const requested = query.sourceIds.length > 0
      ? await loadRequestedSources(this.registry, query.sourceIds)
      : await this.registry.listActive();

    const eligible = requested.filter(
      (source) => isSourceEligibleForDiscovery(source, NewsOrigin.RSS) && source.feedUrl !== null,
    );

    const candidates: DiscoveryProviderResult['candidates'][number][] = [];

    for (const source of eligible) {
      try {
        const feed = await this.feedClient.fetchFeed(source.feedUrl as string);
        for (const item of feed.items) {
          if (!filterByTimeWindow(item.publishedAt, query.from, query.to)) continue;
          candidates.push({
            title: item.title,
            url: item.link,
            sourceName: feed.sourceName ?? source.name,
            publishedAt: item.publishedAt,
            origin: NewsOrigin.RSS,
            discoveredAt: this.clock.now(),
          });
          if (candidates.length >= query.maxCandidates) break;
        }
      } catch {
        warnings.push(`RSS_SOURCE_FETCH_FAILED:${source.id}`);
      }
      if (candidates.length >= query.maxCandidates) break;
    }

    const status = warnings.length > 0
      ? DiscoveryProviderStatus.DEGRADED
      : eligible.length > 0
        ? DiscoveryProviderStatus.AVAILABLE
        : DiscoveryProviderStatus.NOT_CONFIGURED;

    return {
      providerId: this.id,
      origin: this.origin,
      status,
      candidates,
      startedAt,
      completedAt: this.clock.now(),
      warnings,
    };
  }
}
