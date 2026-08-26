import type { IsoUtcDateTime, OrganizationId } from '../common/types';
import { NewsOrigin } from '../news/news-item';

export enum DiscoveryRunStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
}

export interface DiscoveryRunStats {
  readonly providersRequested: number;
  readonly providersCompleted: number;
  readonly rawCandidates: number;
  readonly normalizedCandidates: number;
  readonly exactDuplicatesFiltered: number;
  readonly rejectedCandidates: number;
}

export interface DiscoveryRun {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly status: DiscoveryRunStatus;
  readonly origins: readonly NewsOrigin[];
  readonly providerIds: readonly string[];
  readonly startedAt: IsoUtcDateTime;
  readonly completedAt: IsoUtcDateTime | null;
  readonly stats: DiscoveryRunStats;
  readonly warnings: readonly string[];
  readonly errorCodes: readonly string[];
}

export const emptyDiscoveryRunStats = (): DiscoveryRunStats => ({
  providersRequested: 0,
  providersCompleted: 0,
  rawCandidates: 0,
  normalizedCandidates: 0,
  exactDuplicatesFiltered: 0,
  rejectedCandidates: 0,
});
