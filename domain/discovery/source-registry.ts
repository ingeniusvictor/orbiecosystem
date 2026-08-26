import type {
  ContentCategory,
  SourceCredibilityBand,
  SourceType,
} from '../common/enums';
import type { IsoUtcDateTime, OrganizationId, SourceId } from '../common/types';
import { NewsOrigin } from '../news/news-item';

export enum SourceRegistryStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DISABLED = 'DISABLED',
  DEGRADED = 'DEGRADED',
}

export interface SourceRegistryEntry {
  readonly id: SourceId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly domain: string;
  readonly homepageUrl: string;
  readonly feedUrl: string | null;
  readonly sourceType: SourceType;
  readonly credibilityBand: SourceCredibilityBand;
  readonly allowedOrigins: readonly NewsOrigin[];
  readonly categories: readonly ContentCategory[];
  readonly status: SourceRegistryStatus;
  readonly isPrimaryPreferred: boolean;
  readonly notes: string | null;
  readonly createdAt: IsoUtcDateTime;
  readonly updatedAt: IsoUtcDateTime;
}

export interface SourceRegistryRepository {
  findById(sourceId: SourceId): Promise<SourceRegistryEntry | null>;
  findByDomain(domain: string): Promise<SourceRegistryEntry | null>;
  listActive(): Promise<readonly SourceRegistryEntry[]>;
}

export const isSourceEligibleForDiscovery = (
  source: SourceRegistryEntry,
  origin: NewsOrigin,
): boolean =>
  source.status === SourceRegistryStatus.ACTIVE &&
  source.allowedOrigins.includes(origin);
