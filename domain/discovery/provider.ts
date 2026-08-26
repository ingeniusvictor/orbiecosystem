import type { IsoUtcDateTime, OrganizationId, SourceId } from '../common/types';
import { NewsOrigin, type DiscoveryCandidate } from '../news/news-item';

export enum DiscoveryProviderStatus {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  AVAILABLE = 'AVAILABLE',
  DEGRADED = 'DEGRADED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export interface DiscoveryQuery {
  readonly organizationId: OrganizationId;
  readonly origin: NewsOrigin;
  readonly sourceIds: readonly SourceId[];
  readonly keywords: readonly string[];
  readonly from: IsoUtcDateTime | null;
  readonly to: IsoUtcDateTime | null;
  readonly maxCandidates: number;
}

export interface DiscoveryProviderResult {
  readonly providerId: string;
  readonly origin: NewsOrigin;
  readonly status: DiscoveryProviderStatus;
  readonly candidates: readonly DiscoveryCandidate[];
  readonly startedAt: IsoUtcDateTime;
  readonly completedAt: IsoUtcDateTime;
  readonly warnings: readonly string[];
}

export interface DiscoveryProvider {
  readonly id: string;
  readonly origin: NewsOrigin;
  getStatus(): Promise<DiscoveryProviderStatus>;
  discover(query: DiscoveryQuery): Promise<DiscoveryProviderResult>;
}
