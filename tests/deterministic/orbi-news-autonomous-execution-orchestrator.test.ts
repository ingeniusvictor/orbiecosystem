import test from 'node:test';
import assert from 'node:assert/strict';

import { AutonomyLevel, CapabilityStatus, SystemCapability, SystemMode } from '../../domain/common/enums';
import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import {
  AutomationToggle,
  KillSwitchScope,
  OperationalAction,
  type OperationalAuthoritySnapshot,
  SchedulerJob,
} from '../../domain/operations';
import type { ExecutionLease } from '../../domain/operations/execution-lease';
import type {
  ClaimDurableExecutionLeaseInput,
  CompleteDurableExecutionLeaseInput,
  DurableExecutionLeasePersistence,
  FailDurableExecutionLeaseInput,
} from '../../server/operations/firestore-execution-lease-persistence';
import {
  AutonomousExecutionOutcome,
  createAutonomousExecutionOrchestrator,
} from '../../server/operations/autonomous-execution-orchestrator';

const organizationId = 'orbi-ecosystem' as OrganizationId;
const nowUtc = '2026-08-27T02:00:00.000Z' as IsoUtcDateTime;

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

class MemoryLeasePersistence implements DurableExecutionLeasePersistence {
  lease: ExecutionLease | null = null;
  claims = 0;
  completes = 0;
  failures = 0;

  async load(): Promise<ExecutionLease | null> { return this.lease; }
  async claim(input: ClaimDurableExecutionLeaseInput): Promise<ExecutionLease> {
    this.claims += 1;
    this.lease = {
      leaseId: 'lease-1', tickKey: input.tickKey, status: 'CLAIMED' as ExecutionLease['status'],
      ownerId: input.workerId, attempt: 1, claimedAt: input.nowUtc,
      expiresAt: '2026-08-27T02:05:00.000Z' as IsoUtcDateTime,
      completedAt: null, updatedAt: input.nowUtc, failureReason: null,
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

const baseInput = () => ({
  organizationId,
  workerId: 'worker-a',
  job: SchedulerJob.DISCOVERY_RADAR,
  action: OperationalAction.DISCOVER_NEWS,
  nowUtc,
  completedTickKeys: [] as string[],
  authoritySnapshot: enabledSnapshot(),
  leaseDurationSeconds: 300,
  maxAttempts: 3,
});

test('due + allowed operation claims lease, runs handler and completes lease', async () => {
  const persistence = new MemoryLeasePersistence();
  let handled = 0;
  const orchestrator = createAutonomousExecutionOrchestrator({
    leasePersistence: persistence,
    handler: async (context) => {
      handled += 1;
      assert.equal(context.action, OperationalAction.DISCOVER_NEWS);
      assert.match(context.tickKey, /^DISCOVERY_RADAR:/);
    },
  });

  const result = await orchestrator.execute(baseInput());
  assert.equal(result.outcome, AutonomousExecutionOutcome.COMPLETED);
  assert.equal(handled, 1);
  assert.equal(persistence.claims, 1);
  assert.equal(persistence.completes, 1);
  assert.equal(persistence.failures, 0);
});

test('scheduler NOT_DUE skips before authority, lease and handler', async () => {
  const persistence = new MemoryLeasePersistence();
  let handled = 0;
  const orchestrator = createAutonomousExecutionOrchestrator({ leasePersistence: persistence, handler: async () => { handled += 1; } });
  const input = {
    ...baseInput(),
    job: SchedulerJob.SOCIAL_DIGEST,
    action: OperationalAction.PREPARE_SOCIAL,
  };
  const result = await orchestrator.execute(input);
  assert.equal(result.outcome, AutonomousExecutionOutcome.SKIPPED);
  assert.equal(persistence.claims, 0);
  assert.equal(handled, 0);
});

test('operational BLOCK prevents lease acquisition and handler execution', async () => {
  const persistence = new MemoryLeasePersistence();
  let handled = 0;
  const orchestrator = createAutonomousExecutionOrchestrator({ leasePersistence: persistence, handler: async () => { handled += 1; } });
  const result = await orchestrator.execute({
    ...baseInput(),
    authoritySnapshot: { ...enabledSnapshot(), activeKillSwitches: [KillSwitchScope.GLOBAL] },
  });
  assert.equal(result.outcome, AutonomousExecutionOutcome.BLOCKED);
  assert.equal(persistence.claims, 0);
  assert.equal(handled, 0);
});

test('operational DEFER prevents lease acquisition and handler execution', async () => {
  const persistence = new MemoryLeasePersistence();
  const orchestrator = createAutonomousExecutionOrchestrator({ leasePersistence: persistence, handler: async () => undefined });
  const result = await orchestrator.execute({
    ...baseInput(),
    authoritySnapshot: { ...enabledSnapshot(), toggles: { [AutomationToggle.AUTO_DISCOVERY]: false } },
  });
  assert.equal(result.outcome, AutonomousExecutionOutcome.DEFERRED);
  assert.equal(persistence.claims, 0);
});

test('handler failure marks acquired lease FAILED', async () => {
  const persistence = new MemoryLeasePersistence();
  const orchestrator = createAutonomousExecutionOrchestrator({
    leasePersistence: persistence,
    handler: async () => { throw new Error('DOWNSTREAM_GATE_REJECTED'); },
  });
  const result = await orchestrator.execute(baseInput());
  assert.equal(result.outcome, AutonomousExecutionOutcome.FAILED);
  assert.equal(persistence.claims, 1);
  assert.equal(persistence.completes, 0);
  assert.equal(persistence.failures, 1);
  assert.equal(persistence.lease?.failureReason, 'DOWNSTREAM_GATE_REJECTED');
});

test('job/action mismatch fails before scheduler or lease acquisition', async () => {
  const persistence = new MemoryLeasePersistence();
  const orchestrator = createAutonomousExecutionOrchestrator({ leasePersistence: persistence, handler: async () => undefined });
  await assert.rejects(
    orchestrator.execute({ ...baseInput(), action: OperationalAction.PUBLISH_WEB }),
    /AUTONOMOUS_JOB_ACTION_MISMATCH/,
  );
  assert.equal(persistence.claims, 0);
});

test('breaking scheduler bypasses only digest window and still requires operational authority', async () => {
  const persistence = new MemoryLeasePersistence();
  const orchestrator = createAutonomousExecutionOrchestrator({ leasePersistence: persistence, handler: async () => undefined });
  const result = await orchestrator.execute({
    ...baseInput(),
    job: SchedulerJob.BREAKING_SOCIAL,
    action: OperationalAction.PREPARE_SOCIAL,
    breakingEligible: true,
    authoritySnapshot: {
      ...enabledSnapshot(),
      toggles: { ...enabledSnapshot().toggles, [AutomationToggle.AUTO_PREPARE_SOCIAL]: false },
    },
  });
  assert.equal(result.outcome, AutonomousExecutionOutcome.DEFERRED);
  assert.equal(persistence.claims, 0);
});
