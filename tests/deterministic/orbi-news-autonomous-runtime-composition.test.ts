import test from 'node:test';
import assert from 'node:assert/strict';

import { AutonomyLevel, CapabilityStatus, SystemCapability, SystemMode } from '../../domain/common/enums';
import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import {
  AutomationToggle,
  OperationalAction,
  OperationalDecision,
  OperationalHealthStatus,
  OperationalRunOutcome,
  SchedulerDecision,
  SchedulerJob,
  evaluateSchedulerTick,
  type OperationalAuthoritySnapshot,
  type OperationalRunRecord,
} from '../../domain/operations';
import type { ExecutionLease } from '../../domain/operations/execution-lease';
import {
  createAutonomousExecutionOrchestrator,
  AutonomousExecutionOutcome,
} from '../../server/operations/autonomous-execution-orchestrator';
import { createAutonomousRuntime } from '../../server/operations/autonomous-runtime';
import type { OperationalRunLedger } from '../../server/operations/firestore-operational-run-ledger';
import type {
  ClaimDurableExecutionLeaseInput,
  CompleteDurableExecutionLeaseInput,
  DurableExecutionLeasePersistence,
  FailDurableExecutionLeaseInput,
} from '../../server/operations/firestore-execution-lease-persistence';

const organizationId = 'orbi-ecosystem' as OrganizationId;

class MemoryLedger implements OperationalRunLedger {
  records: OperationalRunRecord[];
  failRead = false;
  failAppend = false;
  constructor(records: readonly OperationalRunRecord[] = []) { this.records = [...records]; }
  async listByOrganization(requested: OrganizationId): Promise<readonly OperationalRunRecord[]> {
    if (this.failRead) throw new Error('LEDGER_READ_FAILED');
    return this.records.filter((record) => record.organizationId === requested);
  }
  async append(record: OperationalRunRecord): Promise<void> {
    if (this.failAppend) throw new Error('LEDGER_APPEND_FAILED');
    if (this.records.some((existing) => existing.runId === record.runId)) throw new Error('OPERATIONAL_RUN_ALREADY_EXISTS');
    this.records.push(record);
  }
}

class MemoryLeasePersistence implements DurableExecutionLeasePersistence {
  lease: ExecutionLease | null = null;
  claims = 0;
  completes = 0;
  failures = 0;
  async load(): Promise<ExecutionLease | null> { return this.lease; }
  async claim(input: ClaimDurableExecutionLeaseInput): Promise<ExecutionLease> {
    this.claims += 1;
    this.lease = {
      leaseId: `lease-${this.claims}`,
      tickKey: input.tickKey,
      status: 'CLAIMED' as ExecutionLease['status'],
      ownerId: input.workerId,
      attempt: this.claims,
      claimedAt: input.nowUtc,
      expiresAt: '2026-08-27T13:05:00.000Z' as IsoUtcDateTime,
      completedAt: null,
      updatedAt: input.nowUtc,
      failureReason: null,
    };
    return this.lease;
  }
  async complete(input: CompleteDurableExecutionLeaseInput): Promise<ExecutionLease> {
    this.completes += 1;
    if (!this.lease) throw new Error('missing lease');
    this.lease = { ...this.lease, status: 'COMPLETED' as ExecutionLease['status'], completedAt: input.completedAt, updatedAt: input.completedAt, expiresAt: null };
    return this.lease;
  }
  async fail(input: FailDurableExecutionLeaseInput): Promise<ExecutionLease> {
    this.failures += 1;
    if (!this.lease) throw new Error('missing lease');
    this.lease = { ...this.lease, status: 'FAILED' as ExecutionLease['status'], updatedAt: input.failedAt, expiresAt: null, failureReason: input.failureReason };
    return this.lease;
  }
}

const enabledSnapshot = (): OperationalAuthoritySnapshot => ({
  systemMode: SystemMode.NORMAL,
  autonomyLevel: AutonomyLevel.LEVEL_5,
  toggles: {
    [AutomationToggle.AUTO_DISCOVERY]: true,
    [AutomationToggle.AUTO_PREPARE_SOCIAL]: true,
  },
  activeKillSwitches: [],
  capabilities: {
    [SystemCapability.NEWS_DISCOVERY]: CapabilityStatus.AVAILABLE,
    [SystemCapability.EDITORIAL_GENERATION]: CapabilityStatus.AVAILABLE,
  },
  dailyBudgets: {},
  retryBudgets: {},
});

const historicalRun = ({
  id,
  outcome,
  finishedAt,
  tickKey = `historical-${id}`,
}: {
  id: string;
  outcome: OperationalRunOutcome;
  finishedAt: IsoUtcDateTime;
  tickKey?: string;
}): OperationalRunRecord => ({
  runId: id,
  organizationId,
  workerId: 'worker-history',
  tickKey,
  job: SchedulerJob.DISCOVERY_RADAR,
  action: OperationalAction.DISCOVER_NEWS,
  schedulerDecision: SchedulerDecision.DUE,
  authorityDecision: OperationalDecision.ALLOW,
  leaseAttempt: 1,
  startedAt: finishedAt,
  finishedAt,
  durationMs: 0,
  outcome,
  reasons: [],
});

const createRuntimeFixture = ({ ledger, handler }: { ledger: MemoryLedger; handler: () => Promise<void> }) => {
  const lease = new MemoryLeasePersistence();
  const orchestrator = createAutonomousExecutionOrchestrator({ leasePersistence: lease, handler });
  const runtime = createAutonomousRuntime({
    ledger,
    runner: orchestrator,
    clock: () => '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
    runIdFactory: () => 'runtime-run-1',
  });
  return { runtime, lease };
};

test('healthy runtime composes history, authority, lease, handler and append-only run audit', async () => {
  const ledger = new MemoryLedger();
  let handled = 0;
  const { runtime, lease } = createRuntimeFixture({ ledger, handler: async () => { handled += 1; } });

  const result = await runtime.execute({
    organizationId,
    workerId: 'worker-a',
    job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS,
    nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
    authoritySnapshot: enabledSnapshot(),
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  });

  assert.equal(result.healthAssessment.status, OperationalHealthStatus.HEALTHY);
  assert.equal(result.autonomy.effectiveAutonomyLevel, AutonomyLevel.LEVEL_5);
  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.COMPLETED);
  assert.equal(handled, 1);
  assert.equal(lease.claims, 1);
  assert.equal(lease.completes, 1);
  assert.equal(result.priorRunCount, 0);
  assert.equal(ledger.records.length, 1);
  assert.equal(ledger.records[0].outcome, OperationalRunOutcome.COMPLETED);
});

test('critical health caps LEVEL_5 to LEVEL_1 before authority and defers social preparation without a lease', async () => {
  const ledger = new MemoryLedger([
    historicalRun({ id: 'h1', outcome: OperationalRunOutcome.COMPLETED, finishedAt: '2026-08-27T12:10:00.000Z' as IsoUtcDateTime }),
    historicalRun({ id: 'h2', outcome: OperationalRunOutcome.COMPLETED, finishedAt: '2026-08-27T12:20:00.000Z' as IsoUtcDateTime }),
    historicalRun({ id: 'h3', outcome: OperationalRunOutcome.FAILED, finishedAt: '2026-08-27T12:30:00.000Z' as IsoUtcDateTime }),
    historicalRun({ id: 'h4', outcome: OperationalRunOutcome.FAILED, finishedAt: '2026-08-27T12:40:00.000Z' as IsoUtcDateTime }),
  ]);
  let handled = 0;
  const { runtime, lease } = createRuntimeFixture({ ledger, handler: async () => { handled += 1; } });

  const result = await runtime.execute({
    organizationId,
    workerId: 'worker-a',
    job: SchedulerJob.SOCIAL_DIGEST,
    action: OperationalAction.PREPARE_SOCIAL,
    nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
    authoritySnapshot: enabledSnapshot(),
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  });

  assert.equal(result.healthAssessment.status, OperationalHealthStatus.CRITICAL);
  assert.equal(result.autonomy.configuredAutonomyLevel, AutonomyLevel.LEVEL_5);
  assert.equal(result.autonomy.effectiveAutonomyLevel, AutonomyLevel.LEVEL_1);
  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.DEFERRED);
  assert.ok(result.execution.reasons.includes('AUTONOMY_LEVEL_BELOW_LEVEL_3'));
  assert.equal(handled, 0);
  assert.equal(lease.claims, 0);
  assert.equal(ledger.records.at(-1)?.outcome, OperationalRunOutcome.DEFERRED);
});

test('completed tick keys come from durable ledger and suppress duplicate execution', async () => {
  const nowUtc = '2026-08-27T13:00:00.000Z' as IsoUtcDateTime;
  const tick = evaluateSchedulerTick({ job: SchedulerJob.DISCOVERY_RADAR, nowUtc, completedTickKeys: [] });
  const ledger = new MemoryLedger([
    historicalRun({ id: 'completed-tick', outcome: OperationalRunOutcome.COMPLETED, finishedAt: '2026-08-27T12:59:00.000Z' as IsoUtcDateTime, tickKey: tick.tickKey }),
  ]);
  let handled = 0;
  const { runtime, lease } = createRuntimeFixture({ ledger, handler: async () => { handled += 1; } });

  const result = await runtime.execute({
    organizationId,
    workerId: 'worker-a',
    job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS,
    nowUtc,
    authoritySnapshot: enabledSnapshot(),
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  });

  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.SKIPPED);
  assert.equal(result.execution.scheduler.decision, SchedulerDecision.DUPLICATE_TICK);
  assert.equal(handled, 0);
  assert.equal(lease.claims, 0);
  assert.equal(ledger.records.at(-1)?.outcome, OperationalRunOutcome.SKIPPED);
});

test('ledger read failure is fail-closed before scheduler side effects, lease or handler', async () => {
  const ledger = new MemoryLedger();
  ledger.failRead = true;
  let handled = 0;
  const { runtime, lease } = createRuntimeFixture({ ledger, handler: async () => { handled += 1; } });

  await assert.rejects(runtime.execute({
    organizationId,
    workerId: 'worker-a',
    job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS,
    nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
    authoritySnapshot: enabledSnapshot(),
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  }), /LEDGER_READ_FAILED/);

  assert.equal(handled, 0);
  assert.equal(lease.claims, 0);
});

test('ledger append failure is surfaced after execution and never falsely reports durable audit success', async () => {
  const ledger = new MemoryLedger();
  ledger.failAppend = true;
  let handled = 0;
  const { runtime, lease } = createRuntimeFixture({ ledger, handler: async () => { handled += 1; } });

  await assert.rejects(runtime.execute({
    organizationId,
    workerId: 'worker-a',
    job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS,
    nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
    authoritySnapshot: enabledSnapshot(),
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  }), /LEDGER_APPEND_FAILED/);

  assert.equal(handled, 1);
  assert.equal(lease.completes, 1);
  assert.equal(ledger.records.length, 0);
});
