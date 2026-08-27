import test from 'node:test';
import assert from 'node:assert/strict';
import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import { DiscoveryProviderStatus, type DiscoveryProvider, type DiscoveryQuery } from '../../domain/discovery/provider';
import { NewsOrigin } from '../../domain/news/news-item';
import { OperationalAction, SchedulerJob } from '../../domain/operations';
import { createProductionDiscoveryHandler } from '../../server/operations/production-discovery-handler';

const context = {
  organizationId: 'orbi-ecosystem' as OrganizationId,
  workerId: 'worker-a',
  job: SchedulerJob.DISCOVERY_RADAR,
  action: OperationalAction.DISCOVER_NEWS,
  tickKey: 'DISCOVERY_RADAR:2026-08-27:09',
  nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
};

const provider = (status: DiscoveryProviderStatus, onQuery?: (query: DiscoveryQuery) => void): DiscoveryProvider => ({
  id: 'provider-1',
  origin: NewsOrigin.WEB_SEARCH,
  async getStatus() { return status; },
  async discover(query) {
    onQuery?.(query);
    return {
      providerId: 'provider-1',
      origin: NewsOrigin.WEB_SEARCH,
      status,
      candidates: [],
      startedAt: context.nowUtc,
      completedAt: context.nowUtc,
      warnings: [],
    };
  },
});

test('unavailable provider fails before discovery or sink persistence', async () => {
  let persisted = 0;
  const handler = createProductionDiscoveryHandler({
    provider: provider(DiscoveryProviderStatus.NOT_CONFIGURED),
    sink: { async persist() { persisted += 1; } },
  });
  await assert.rejects(() => handler(context), /DISCOVERY_PROVIDER_NOT_CONFIGURED/);
  assert.equal(persisted, 0);
});

test('available provider receives bounded one-hour query and result is persisted', async () => {
  let captured: DiscoveryQuery | null = null;
  let persisted = 0;
  const handler = createProductionDiscoveryHandler({
    provider: provider(DiscoveryProviderStatus.AVAILABLE, (query) => { captured = query; }),
    sink: { async persist() { persisted += 1; } },
    keywords: ['AI', 'solar'],
    lookbackMinutes: 60,
    maxCandidates: 25,
  });
  await handler(context);
  assert.ok(captured);
  assert.equal(captured!.from, '2026-08-27T12:00:00.000Z');
  assert.equal(captured!.to, context.nowUtc);
  assert.deepEqual(captured!.keywords, ['AI', 'solar']);
  assert.equal(captured!.maxCandidates, 25);
  assert.equal(persisted, 1);
});

test('invalid bounds fail closed before provider work', async () => {
  const handler = createProductionDiscoveryHandler({
    provider: provider(DiscoveryProviderStatus.AVAILABLE),
    sink: { async persist() {} },
    lookbackMinutes: 0,
  });
  await assert.rejects(() => handler(context), /DISCOVERY_LOOKBACK_MINUTES_INVALID/);
});
