import type { SourceId, IsoUtcDateTime } from '../../domain/common/types';
import { DiscoveryProviderStatus, type DiscoveryProvider, type DiscoveryProviderResult } from '../../domain/discovery/provider';
import type { AutonomousOperationHandlerContext } from './autonomous-execution-orchestrator';

export interface ProductionDiscoverySink {
  persist(input: {
    readonly context: AutonomousOperationHandlerContext;
    readonly result: DiscoveryProviderResult;
  }): Promise<void>;
}

const asIso = (value: number): IsoUtcDateTime => new Date(value).toISOString() as IsoUtcDateTime;

/**
 * Bridges DISCOVER_NEWS to a real DiscoveryProvider contract and explicit sink.
 * Provider availability is checked before search and non-available results fail closed.
 */
export const createProductionDiscoveryHandler = ({
  provider,
  sink,
  sourceIds = [],
  keywords = [],
  lookbackMinutes = 60,
  maxCandidates = 50,
}: {
  readonly provider: DiscoveryProvider;
  readonly sink: ProductionDiscoverySink;
  readonly sourceIds?: readonly SourceId[];
  readonly keywords?: readonly string[];
  readonly lookbackMinutes?: number;
  readonly maxCandidates?: number;
}) => async (context: AutonomousOperationHandlerContext): Promise<void> => {
  if (!Number.isInteger(lookbackMinutes) || lookbackMinutes <= 0) throw new RangeError('DISCOVERY_LOOKBACK_MINUTES_INVALID');
  if (!Number.isInteger(maxCandidates) || maxCandidates <= 0) throw new RangeError('DISCOVERY_MAX_CANDIDATES_INVALID');

  const providerStatus = await provider.getStatus();
  if (providerStatus !== DiscoveryProviderStatus.AVAILABLE && providerStatus !== DiscoveryProviderStatus.DEGRADED) {
    throw new Error(`DISCOVERY_PROVIDER_${providerStatus}`);
  }

  const nowMs = new Date(context.nowUtc).getTime();
  if (!Number.isFinite(nowMs)) throw new RangeError('DISCOVERY_CONTEXT_TIME_INVALID');
  const result = await provider.discover({
    organizationId: context.organizationId,
    origin: provider.origin,
    sourceIds,
    keywords,
    from: asIso(nowMs - lookbackMinutes * 60_000),
    to: context.nowUtc,
    maxCandidates,
  });

  if (result.status !== DiscoveryProviderStatus.AVAILABLE && result.status !== DiscoveryProviderStatus.DEGRADED) {
    throw new Error(`DISCOVERY_RESULT_${result.status}`);
  }
  await sink.persist({ context, result });
};
