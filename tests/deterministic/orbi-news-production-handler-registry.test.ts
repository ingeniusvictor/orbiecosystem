import test from 'node:test';
import assert from 'node:assert/strict';
import type { OrganizationId, IsoUtcDateTime } from '../../domain/common/types';
import { OperationalAction, SchedulerJob } from '../../domain/operations';
import { createProductionOperationHandler, listConfiguredProductionActions } from '../../server/operations/production-handler-registry';

const context = {
  organizationId: 'orbi-ecosystem' as OrganizationId,
  workerId: 'worker-a',
  job: SchedulerJob.DISCOVERY_RADAR,
  action: OperationalAction.DISCOVER_NEWS,
  tickKey: 'DISCOVERY_RADAR:2026-08-27:09',
  nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
};

test('missing production handler fails closed', async () => {
  await assert.rejects(() => createProductionOperationHandler({})(context), /OPERATION_HANDLER_DISCOVER_NEWS_NOT_CONFIGURED/);
});

test('registered handler is invoked and list excludes missing actions', async () => {
  let calls = 0;
  const registry = {
    [OperationalAction.DISCOVER_NEWS]: async () => { calls += 1; },
    [OperationalAction.PREPARE_SOCIAL]: async () => undefined,
  };
  await createProductionOperationHandler(registry)(context);
  assert.equal(calls, 1);
  assert.deepEqual(listConfiguredProductionActions(registry), [OperationalAction.DISCOVER_NEWS, OperationalAction.PREPARE_SOCIAL]);
});
