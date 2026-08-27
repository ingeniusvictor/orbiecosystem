import test from 'node:test';
import assert from 'node:assert/strict';
import { AutonomyLevel } from '../../domain/common/enums';
import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import {
  OperationalAction,
  OperationalHealthStatus,
  OperationalRunOutcome,
  SchedulerDecision,
  SchedulerJob,
  aggregateOperationalHealth,
  assessOperationalHealth,
  type OperationalRunRecord,
} from '../../domain/operations';

const organizationId = 'orbi-ecosystem' as OrganizationId;
const at = (hour: number) => `2026-08-27T${String(hour).padStart(2, '0')}:00:00.000Z` as IsoUtcDateTime;

const run = (id: string, outcome: OperationalRunOutcome, hour: number, leaseAttempt: number | null = 1): OperationalRunRecord => ({
  runId: id,
  organizationId,
  workerId: 'worker-a',
  tickKey: `DISCOVERY_RADAR:2026-08-27:${hour}`,
  job: SchedulerJob.DISCOVERY_RADAR,
  action: OperationalAction.DISCOVER_NEWS,
  schedulerDecision: SchedulerDecision.DUE,
  authorityDecision: outcome === OperationalRunOutcome.SKIPPED ? null : 'ALLOW' as OperationalRunRecord['authorityDecision'],
  leaseAttempt: outcome === OperationalRunOutcome.BLOCKED || outcome === OperationalRunOutcome.DEFERRED || outcome === OperationalRunOutcome.SKIPPED ? null : leaseAttempt,
  startedAt: at(hour),
  finishedAt: at(hour),
  durationMs: 0,
  outcome,
  reasons: [],
});

test('healthy history produces no autonomy reduction recommendation', () => {
  const records = [
    run('r1', OperationalRunOutcome.COMPLETED, 1),
    run('r2', OperationalRunOutcome.COMPLETED, 2),
    run('r3', OperationalRunOutcome.COMPLETED, 3),
    run('r4', OperationalRunOutcome.COMPLETED, 4),
  ];
  const result = assessOperationalHealth({ snapshot: aggregateOperationalHealth(records), records, nowUtc: at(5) });
  assert.equal(result.status, OperationalHealthStatus.HEALTHY);
  assert.equal(result.recommendedAutonomyCeiling, null);
  assert.deepEqual(result.reasons, []);
});

test('25 percent terminal failure rate degrades health with sufficient sample', () => {
  const records = [
    run('r1', OperationalRunOutcome.COMPLETED, 1),
    run('r2', OperationalRunOutcome.COMPLETED, 2),
    run('r3', OperationalRunOutcome.COMPLETED, 3),
    run('r4', OperationalRunOutcome.FAILED, 4),
  ];
  const result = assessOperationalHealth({ snapshot: aggregateOperationalHealth(records), records, nowUtc: at(5) });
  assert.equal(result.status, OperationalHealthStatus.DEGRADED);
  assert.ok(result.reasons.includes('DEGRADED_FAILURE_RATE'));
  assert.equal(result.recommendedAutonomyCeiling, AutonomyLevel.LEVEL_3);
});

test('retry pressure can degrade health independently of failure rate', () => {
  const records = [
    run('r1', OperationalRunOutcome.COMPLETED, 1, 2),
    run('r2', OperationalRunOutcome.COMPLETED, 2, 2),
    run('r3', OperationalRunOutcome.COMPLETED, 3),
    run('r4', OperationalRunOutcome.COMPLETED, 4),
  ];
  const result = assessOperationalHealth({ snapshot: aggregateOperationalHealth(records), records, nowUtc: at(5) });
  assert.equal(result.status, OperationalHealthStatus.DEGRADED);
  assert.ok(result.reasons.includes('DEGRADED_RETRY_PRESSURE'));
});

test('five consecutive terminal failures are critical regardless of older successes', () => {
  const records = [
    run('success', OperationalRunOutcome.COMPLETED, 1),
    run('f1', OperationalRunOutcome.FAILED, 2),
    run('f2', OperationalRunOutcome.FAILED, 3),
    run('f3', OperationalRunOutcome.FAILED, 4),
    run('f4', OperationalRunOutcome.FAILED, 5),
    run('f5', OperationalRunOutcome.FAILED, 6),
  ];
  const result = assessOperationalHealth({ snapshot: aggregateOperationalHealth(records), records, nowUtc: at(7) });
  assert.equal(result.status, OperationalHealthStatus.CRITICAL);
  assert.equal(result.failureStreak, 5);
  assert.ok(result.reasons.includes('CRITICAL_FAILURE_STREAK'));
  assert.equal(result.recommendedAutonomyCeiling, AutonomyLevel.LEVEL_1);
});

test('24 hours without success after activity becomes critical', () => {
  const records = [run('r1', OperationalRunOutcome.COMPLETED, 0)];
  const now = '2026-08-28T00:00:00.000Z' as IsoUtcDateTime;
  const result = assessOperationalHealth({ snapshot: aggregateOperationalHealth(records), records, nowUtc: now });
  assert.equal(result.status, OperationalHealthStatus.CRITICAL);
  assert.ok(result.reasons.includes('CRITICAL_NO_RECENT_SUCCESS'));
  assert.equal(result.hoursSinceLastSuccess, 24);
});

test('blocked and deferred records do not create failure streaks', () => {
  const records = [
    run('r1', OperationalRunOutcome.COMPLETED, 1),
    run('r2', OperationalRunOutcome.BLOCKED, 2),
    run('r3', OperationalRunOutcome.DEFERRED, 3),
  ];
  const result = assessOperationalHealth({ snapshot: aggregateOperationalHealth(records), records, nowUtc: at(4) });
  assert.equal(result.failureStreak, 0);
  assert.equal(result.status, OperationalHealthStatus.HEALTHY);
});

test('small samples do not trigger rate thresholds alone', () => {
  const records = [
    run('r1', OperationalRunOutcome.COMPLETED, 1),
    run('r2', OperationalRunOutcome.FAILED, 2),
  ];
  const result = assessOperationalHealth({ snapshot: aggregateOperationalHealth(records), records, nowUtc: at(3) });
  assert.equal(result.status, OperationalHealthStatus.HEALTHY);
});

test('policy rejects invalid threshold ordering', () => {
  const records = [run('r1', OperationalRunOutcome.COMPLETED, 1)];
  assert.throws(() => assessOperationalHealth({
    snapshot: aggregateOperationalHealth(records),
    records,
    nowUtc: at(2),
    config: {
      minimumTerminalSample: 4,
      degradedFailureRate: 0.5,
      criticalFailureRate: 0.25,
      degradedRetryRate: 0.3,
      criticalRetryRate: 0.6,
      degradedFailureStreak: 3,
      criticalFailureStreak: 5,
      degradedNoSuccessHours: 6,
      criticalNoSuccessHours: 24,
    },
  }), /criticalFailureRate/);
});
