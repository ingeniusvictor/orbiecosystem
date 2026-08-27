import test from 'node:test';
import assert from 'node:assert/strict';
import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import {
  OperationalAction,
  OperationalRunOutcome,
  SchedulerDecision,
  SchedulerJob,
  aggregateOperationalHealth,
  type OperationalRunRecord,
} from '../../domain/operations';
import { OperationalDecision } from '../../domain/operations/operational-authority';

const organizationId = 'orbi-ecosystem' as OrganizationId;
const run = (
  runId: string,
  outcome: OperationalRunOutcome,
  finishedAt: string,
  overrides: Partial<OperationalRunRecord> = {},
): OperationalRunRecord => ({
  runId,
  organizationId,
  workerId: 'worker-a',
  tickKey: `DISCOVERY_RADAR:2026-08-27:${runId}`,
  job: SchedulerJob.DISCOVERY_RADAR,
  action: OperationalAction.DISCOVER_NEWS,
  schedulerDecision: SchedulerDecision.DUE,
  authorityDecision: OperationalDecision.ALLOW,
  leaseAttempt: outcome === OperationalRunOutcome.BLOCKED || outcome === OperationalRunOutcome.DEFERRED || outcome === OperationalRunOutcome.SKIPPED ? null : 1,
  startedAt: '2026-08-27T04:00:00.000Z' as IsoUtcDateTime,
  finishedAt: finishedAt as IsoUtcDateTime,
  durationMs: 1000,
  outcome,
  reasons: [],
  ...overrides,
});

test('aggregates totals, terminal rates, duration and last run timestamps', () => {
  const records = [
    run('1', OperationalRunOutcome.COMPLETED, '2026-08-27T04:00:01.000Z', { durationMs: 1000 }),
    run('2', OperationalRunOutcome.FAILED, '2026-08-27T04:01:00.000Z', { durationMs: 3000 }),
    run('3', OperationalRunOutcome.BLOCKED, '2026-08-27T04:02:00.000Z'),
    run('4', OperationalRunOutcome.DEFERRED, '2026-08-27T04:03:00.000Z'),
    run('5', OperationalRunOutcome.SKIPPED, '2026-08-27T04:04:00.000Z', { schedulerDecision: SchedulerDecision.NOT_DUE, authorityDecision: null }),
  ];
  const result = aggregateOperationalHealth(records);
  assert.deepEqual(result.counts, { total: 5, completed: 1, failed: 1, blocked: 1, deferred: 1, skipped: 1 });
  assert.equal(result.terminalRuns, 2);
  assert.equal(result.successRate, 0.5);
  assert.equal(result.failureRate, 0.5);
  assert.equal(result.averageDurationMs, 2000);
  assert.equal(result.lastSuccessfulRunAt, '2026-08-27T04:00:01.000Z');
  assert.equal(result.lastFailedRunAt, '2026-08-27T04:01:00.000Z');
  assert.equal(result.lastRunAt, '2026-08-27T04:04:00.000Z');
});

test('blocked, deferred and skipped do not count as handler failures', () => {
  const result = aggregateOperationalHealth([
    run('1', OperationalRunOutcome.BLOCKED, '2026-08-27T04:00:01.000Z'),
    run('2', OperationalRunOutcome.DEFERRED, '2026-08-27T04:00:02.000Z'),
    run('3', OperationalRunOutcome.SKIPPED, '2026-08-27T04:00:03.000Z', { schedulerDecision: SchedulerDecision.NOT_DUE, authorityDecision: null }),
  ]);
  assert.equal(result.terminalRuns, 0);
  assert.equal(result.successRate, null);
  assert.equal(result.failureRate, null);
});

test('retry metrics derive from leaseAttempt greater than one', () => {
  const result = aggregateOperationalHealth([
    run('1', OperationalRunOutcome.COMPLETED, '2026-08-27T04:00:01.000Z', { leaseAttempt: 1 }),
    run('2', OperationalRunOutcome.COMPLETED, '2026-08-27T04:01:01.000Z', { leaseAttempt: 2 }),
    run('3', OperationalRunOutcome.FAILED, '2026-08-27T04:02:01.000Z', { leaseAttempt: 3 }),
    run('4', OperationalRunOutcome.BLOCKED, '2026-08-27T04:03:01.000Z'),
  ]);
  assert.equal(result.retryRuns, 2);
  assert.equal(result.retryRate, 0.6667);
});

test('provides per-job and per-action breakdowns', () => {
  const records = [
    run('1', OperationalRunOutcome.COMPLETED, '2026-08-27T04:00:01.000Z'),
    run('2', OperationalRunOutcome.FAILED, '2026-08-27T04:01:01.000Z', {
      job: SchedulerJob.SOCIAL_DIGEST,
      action: OperationalAction.PREPARE_SOCIAL,
      tickKey: 'SOCIAL_DIGEST:2026-08-27:09',
    }),
  ];
  const result = aggregateOperationalHealth(records);
  assert.equal(result.byJob[SchedulerJob.DISCOVERY_RADAR].completed, 1);
  assert.equal(result.byJob[SchedulerJob.SOCIAL_DIGEST].failed, 1);
  assert.equal(result.byAction[OperationalAction.DISCOVER_NEWS].completed, 1);
  assert.equal(result.byAction[OperationalAction.PREPARE_SOCIAL].failed, 1);
});

test('empty ledger yields neutral null rates instead of fake zero health', () => {
  const result = aggregateOperationalHealth([]);
  assert.equal(result.counts.total, 0);
  assert.equal(result.successRate, null);
  assert.equal(result.failureRate, null);
  assert.equal(result.averageDurationMs, null);
  assert.equal(result.retryRate, null);
  assert.equal(result.lastRunAt, null);
});
