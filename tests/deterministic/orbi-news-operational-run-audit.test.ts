import test from 'node:test';
import assert from 'node:assert/strict';

import { OperationalAction, OperationalDecision } from '../../domain/operations/operational-authority';
import { OperationalRunOutcome, createOperationalRunRecord } from '../../domain/operations/operational-run';
import { SchedulerDecision, SchedulerJob } from '../../domain/operations/scheduler';
import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import {
  AutonomousExecutionOutcome,
  type AutonomousExecutionInput,
  type AutonomousExecutionResult,
} from '../../server/operations/autonomous-execution-orchestrator';
import { createObservedAutonomousExecution } from '../../server/operations/observed-autonomous-execution';

const organizationId = 'orbi-ecosystem' as OrganizationId;
const startedAt = '2026-08-27T04:00:00.000Z' as IsoUtcDateTime;
const finishedAt = '2026-08-27T04:00:01.250Z' as IsoUtcDateTime;

const scheduler = {
  decision: SchedulerDecision.DUE,
  tickKey: 'DISCOVERY_RADAR:2026-08-27:00',
  editorialDate: '2026-08-27',
  editorialHour: 0,
  reasons: [] as string[],
};

const authority = {
  action: OperationalAction.DISCOVER_NEWS,
  decision: OperationalDecision.ALLOW,
  reasons: [] as string[],
};

test('operational run record captures deterministic duration and lease attempt', () => {
  const record = createOperationalRunRecord({
    runId: 'run-1', organizationId, workerId: 'worker-a', job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS, scheduler, authority, leaseAttempt: 2,
    startedAt, finishedAt, outcome: OperationalRunOutcome.COMPLETED, reasons: [],
  });
  assert.equal(record.durationMs, 1250);
  assert.equal(record.leaseAttempt, 2);
  assert.equal(record.schedulerDecision, SchedulerDecision.DUE);
  assert.equal(record.authorityDecision, OperationalDecision.ALLOW);
});

test('skipped run may have no authority and no lease attempt', () => {
  const record = createOperationalRunRecord({
    runId: 'run-skip', organizationId, workerId: 'worker-a', job: SchedulerJob.SOCIAL_DIGEST,
    action: OperationalAction.PREPARE_SOCIAL,
    scheduler: { ...scheduler, decision: SchedulerDecision.NOT_DUE, tickKey: 'SOCIAL_DIGEST:2026-08-27:00', reasons: ['SOCIAL_DIGEST_OUTSIDE_EXECUTION_WINDOW'] },
    authority: null, leaseAttempt: null, startedAt, finishedAt: startedAt,
    outcome: OperationalRunOutcome.SKIPPED, reasons: ['SOCIAL_DIGEST_OUTSIDE_EXECUTION_WINDOW'],
  });
  assert.equal(record.authorityDecision, null);
  assert.equal(record.leaseAttempt, null);
  assert.equal(record.durationMs, 0);
});

test('invalid audit chronology and completed-without-lease fail closed', () => {
  assert.throws(() => createOperationalRunRecord({
    runId: 'run-bad', organizationId, workerId: 'worker-a', job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS, scheduler, authority, leaseAttempt: 1,
    startedAt: finishedAt, finishedAt: startedAt, outcome: OperationalRunOutcome.FAILED, reasons: [],
  }), /OPERATIONAL_RUN_FINISHED_BEFORE_STARTED/);

  assert.throws(() => createOperationalRunRecord({
    runId: 'run-bad2', organizationId, workerId: 'worker-a', job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS, scheduler, authority, leaseAttempt: null,
    startedAt, finishedAt, outcome: OperationalRunOutcome.COMPLETED, reasons: [],
  }), /OPERATIONAL_RUN_COMPLETED_REQUIRES_LEASE_ATTEMPT/);
});

test('observed wrapper produces run record from real execution result without changing authority', async () => {
  const input = {
    organizationId, workerId: 'worker-a', job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS, nowUtc: startedAt, completedTickKeys: [],
    authoritySnapshot: {} as AutonomousExecutionInput['authoritySnapshot'], leaseDurationSeconds: 300, maxAttempts: 3,
  } satisfies AutonomousExecutionInput;

  const execution: AutonomousExecutionResult = {
    outcome: AutonomousExecutionOutcome.COMPLETED,
    scheduler,
    authority,
    tickKey: scheduler.tickKey,
    leaseAttempt: 1,
    reasons: [],
  };

  const times = [startedAt, finishedAt];
  const observed = createObservedAutonomousExecution({
    runner: { execute: async () => execution },
    clock: () => times.shift()!,
    runIdFactory: () => 'run-observed',
  });

  const result = await observed.execute(input);
  assert.equal(result.execution, execution);
  assert.equal(result.runRecord.runId, 'run-observed');
  assert.equal(result.runRecord.outcome, OperationalRunOutcome.COMPLETED);
  assert.equal(result.runRecord.durationMs, 1250);
  assert.equal(result.runRecord.leaseAttempt, 1);
});
