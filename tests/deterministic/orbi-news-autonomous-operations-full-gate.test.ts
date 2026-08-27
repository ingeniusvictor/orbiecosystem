import test from 'node:test';
import assert from 'node:assert/strict';

import { AutonomyLevel, CapabilityStatus, SystemCapability, SystemMode } from '../../domain/common/enums';
import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import {
  AutomationToggle,
  KillSwitchScope,
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
import {
  ExecutionLeaseStatus,
  claimExecutionLease,
  completeExecutionLease,
  createAvailableExecutionLease,
  failExecutionLease,
  type ExecutionLease,
} from '../../domain/operations/execution-lease';
import {
  AutonomousExecutionOutcome,
  createAutonomousExecutionOrchestrator,
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
const nowUtc = '2026-08-27T13:00:00.000Z' as IsoUtcDateTime;

class MemoryLedger implements OperationalRunLedger {
  records: OperationalRunRecord[];
  constructor(records: readonly OperationalRunRecord[] = []) { this.records = [...records]; }
  async listByOrganization(requested: OrganizationId): Promise<readonly OperationalRunRecord[]> {
    return this.records.filter((record) => record.organizationId === requested);
  }
  async append(record: OperationalRunRecord): Promise<void> {
    if (this.records.some((existing) => existing.runId === record.runId)) throw new Error('OPERATIONAL_RUN_ALREADY_EXISTS');
    this.records.push(record);
  }
}

class DomainLeasePersistence implements DurableExecutionLeasePersistence {
  lease: ExecutionLease | null = null;
  claims = 0;
  completes = 0;
  failures = 0;

  async load(): Promise<ExecutionLease | null> { return this.lease; }

  async claim(input: ClaimDurableExecutionLeaseInput): Promise<ExecutionLease> {
    this.claims += 1;
    const current = this.lease ?? createAvailableExecutionLease({
      leaseId: `lease-${input.tickKey}`,
      tickKey: input.tickKey,
      createdAt: input.nowUtc,
    });
    this.lease = claimExecutionLease({
      lease: current,
      workerId: input.workerId,
      nowUtc: input.nowUtc,
      leaseDurationSeconds: input.leaseDurationSeconds,
      maxAttempts: input.maxAttempts,
    });
    return this.lease;
  }

  async complete(input: CompleteDurableExecutionLeaseInput): Promise<ExecutionLease> {
    this.completes += 1;
    if (!this.lease) throw new Error('EXECUTION_LEASE_MISSING');
    this.lease = completeExecutionLease({
      lease: this.lease,
      workerId: input.workerId,
      completedAt: input.completedAt,
    });
    return this.lease;
  }

  async fail(input: FailDurableExecutionLeaseInput): Promise<ExecutionLease> {
    this.failures += 1;
    if (!this.lease) throw new Error('EXECUTION_LEASE_MISSING');
    this.lease = failExecutionLease({
      lease: this.lease,
      workerId: input.workerId,
      failedAt: input.failedAt,
      failureReason: input.failureReason,
    });
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

const historicalRun = ({ id, outcome, finishedAt, tickKey = `historical-${id}` }: {
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

let runSequence = 0;
const createFixture = ({ ledger = new MemoryLedger(), lease = new DomainLeasePersistence(), handler = async () => undefined }: {
  ledger?: MemoryLedger;
  lease?: DomainLeasePersistence;
  handler?: () => Promise<void>;
} = {}) => {
  const orchestrator = createAutonomousExecutionOrchestrator({ leasePersistence: lease, handler });
  const runtime = createAutonomousRuntime({
    ledger,
    runner: orchestrator,
    clock: () => nowUtc,
    runIdFactory: () => `full-gate-run-${++runSequence}`,
  });
  return { runtime, ledger, lease };
};

const discoveryInput = (overrides: Partial<OperationalAuthoritySnapshot> = {}) => ({
  organizationId,
  workerId: 'worker-a',
  job: SchedulerJob.DISCOVERY_RADAR,
  action: OperationalAction.DISCOVER_NEWS,
  nowUtc,
  authoritySnapshot: { ...enabledSnapshot(), ...overrides },
  leaseDurationSeconds: 300,
  maxAttempts: 3,
});

test('FULL GATE positive path: healthy due operation executes once, completes lease and appends immutable audit', async () => {
  let handled = 0;
  const { runtime, ledger, lease } = createFixture({ handler: async () => { handled += 1; } });
  const result = await runtime.execute(discoveryInput());

  assert.equal(result.healthAssessment.status, OperationalHealthStatus.HEALTHY);
  assert.equal(result.autonomy.effectiveAutonomyLevel, AutonomyLevel.LEVEL_5);
  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.COMPLETED);
  assert.equal(handled, 1);
  assert.equal(lease.lease?.status, ExecutionLeaseStatus.COMPLETED);
  assert.equal(ledger.records.at(-1)?.outcome, OperationalRunOutcome.COMPLETED);
});

test('FULL GATE kill switch blocks before lease and handler while preserving audit', async () => {
  let handled = 0;
  const { runtime, ledger, lease } = createFixture({ handler: async () => { handled += 1; } });
  const result = await runtime.execute(discoveryInput({ activeKillSwitches: [KillSwitchScope.GLOBAL] }));

  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.BLOCKED);
  assert.ok(result.execution.reasons.includes('KILL_SWITCH_GLOBAL'));
  assert.equal(lease.claims, 0);
  assert.equal(handled, 0);
  assert.equal(ledger.records.at(-1)?.outcome, OperationalRunOutcome.BLOCKED);
});

test('FULL GATE critical health reduces LEVEL_5 to LEVEL_1 and prevents social preparation before lease', async () => {
  const ledger = new MemoryLedger([
    historicalRun({ id: 'h1', outcome: OperationalRunOutcome.COMPLETED, finishedAt: '2026-08-27T12:10:00.000Z' as IsoUtcDateTime }),
    historicalRun({ id: 'h2', outcome: OperationalRunOutcome.COMPLETED, finishedAt: '2026-08-27T12:20:00.000Z' as IsoUtcDateTime }),
    historicalRun({ id: 'h3', outcome: OperationalRunOutcome.FAILED, finishedAt: '2026-08-27T12:30:00.000Z' as IsoUtcDateTime }),
    historicalRun({ id: 'h4', outcome: OperationalRunOutcome.FAILED, finishedAt: '2026-08-27T12:40:00.000Z' as IsoUtcDateTime }),
  ]);
  let handled = 0;
  const { runtime, lease } = createFixture({ ledger, handler: async () => { handled += 1; } });
  const result = await runtime.execute({
    ...discoveryInput(),
    job: SchedulerJob.SOCIAL_DIGEST,
    action: OperationalAction.PREPARE_SOCIAL,
  });

  assert.equal(result.healthAssessment.status, OperationalHealthStatus.CRITICAL);
  assert.equal(result.autonomy.effectiveAutonomyLevel, AutonomyLevel.LEVEL_1);
  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.DEFERRED);
  assert.ok(result.execution.reasons.includes('AUTONOMY_LEVEL_BELOW_LEVEL_3'));
  assert.equal(lease.claims, 0);
  assert.equal(handled, 0);
});

test('FULL GATE completed durable tick is skipped and cannot execute twice', async () => {
  const tick = evaluateSchedulerTick({ job: SchedulerJob.DISCOVERY_RADAR, nowUtc, completedTickKeys: [] });
  const ledger = new MemoryLedger([
    historicalRun({ id: 'prior-completed', outcome: OperationalRunOutcome.COMPLETED, finishedAt: '2026-08-27T12:59:00.000Z' as IsoUtcDateTime, tickKey: tick.tickKey }),
  ]);
  let handled = 0;
  const { runtime, lease } = createFixture({ ledger, handler: async () => { handled += 1; } });
  const result = await runtime.execute(discoveryInput());

  assert.equal(result.execution.scheduler.decision, SchedulerDecision.DUPLICATE_TICK);
  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.SKIPPED);
  assert.equal(lease.claims, 0);
  assert.equal(handled, 0);
});

test('FULL GATE active lease owned by another worker blocks concurrent execution and is audited FAILED', async () => {
  const lease = new DomainLeasePersistence();
  const tick = evaluateSchedulerTick({ job: SchedulerJob.DISCOVERY_RADAR, nowUtc, completedTickKeys: [] });
  lease.lease = claimExecutionLease({
    lease: createAvailableExecutionLease({ leaseId: 'shared-lease', tickKey: tick.tickKey, createdAt: nowUtc }),
    workerId: 'worker-other',
    nowUtc,
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  });
  let handled = 0;
  const { runtime, ledger } = createFixture({ lease, handler: async () => { handled += 1; } });
  const result = await runtime.execute(discoveryInput());

  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.FAILED);
  assert.ok(result.execution.reasons.includes('EXECUTION_LEASE_ALREADY_CLAIMED'));
  assert.equal(handled, 0);
  assert.equal(ledger.records.at(-1)?.outcome, OperationalRunOutcome.FAILED);
});

test('FULL GATE retry exhaustion fails closed without handler execution', async () => {
  const lease = new DomainLeasePersistence();
  const tick = evaluateSchedulerTick({ job: SchedulerJob.DISCOVERY_RADAR, nowUtc, completedTickKeys: [] });
  lease.lease = {
    ...createAvailableExecutionLease({ leaseId: 'retry-exhausted', tickKey: tick.tickKey, createdAt: nowUtc }),
    status: ExecutionLeaseStatus.FAILED,
    attempt: 2,
    failureReason: 'previous failure',
  };
  let handled = 0;
  const { runtime, ledger } = createFixture({ lease, handler: async () => { handled += 1; } });
  const result = await runtime.execute({ ...discoveryInput(), maxAttempts: 2 });

  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.FAILED);
  assert.ok(result.execution.reasons.includes('EXECUTION_LEASE_RETRY_BUDGET_EXHAUSTED'));
  assert.equal(handled, 0);
  assert.equal(ledger.records.at(-1)?.outcome, OperationalRunOutcome.FAILED);
});

test('FULL GATE downstream editorial/publication rejection cannot be bypassed by operational ALLOW', async () => {
  const { runtime, ledger, lease } = createFixture({
    handler: async () => { throw new Error('DOWNSTREAM_PUBLICATION_GATE_REJECTED'); },
  });
  const result = await runtime.execute(discoveryInput());

  assert.equal(result.execution.authority?.decision, OperationalDecision.ALLOW);
  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.FAILED);
  assert.ok(result.execution.reasons.includes('DOWNSTREAM_PUBLICATION_GATE_REJECTED'));
  assert.equal(lease.lease?.status, ExecutionLeaseStatus.FAILED);
  assert.equal(ledger.records.at(-1)?.outcome, OperationalRunOutcome.FAILED);
  assert.ok(ledger.records.at(-1)?.reasons.includes('DOWNSTREAM_PUBLICATION_GATE_REJECTED'));
});

test('FULL GATE breaking bypasses digest timing only; operational toggle still defers before lease', async () => {
  const snapshot = enabledSnapshot();
  const { runtime, ledger, lease } = createFixture();
  const result = await runtime.execute({
    organizationId,
    workerId: 'worker-a',
    job: SchedulerJob.BREAKING_SOCIAL,
    action: OperationalAction.PREPARE_SOCIAL,
    nowUtc,
    breakingEligible: true,
    authoritySnapshot: {
      ...snapshot,
      toggles: { ...snapshot.toggles, [AutomationToggle.AUTO_PREPARE_SOCIAL]: false },
    },
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  });

  assert.equal(result.execution.scheduler.decision, SchedulerDecision.DUE_BREAKING);
  assert.equal(result.execution.outcome, AutonomousExecutionOutcome.DEFERRED);
  assert.equal(lease.claims, 0);
  assert.equal(ledger.records.at(-1)?.outcome, OperationalRunOutcome.DEFERRED);
});
