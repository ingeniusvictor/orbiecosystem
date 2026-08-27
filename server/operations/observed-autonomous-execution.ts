import { randomUUID } from 'node:crypto';
import type { IsoUtcDateTime } from '../../domain/common/types';
import {
  OperationalRunOutcome,
  createOperationalRunRecord,
  type OperationalRunRecord,
} from '../../domain/operations/operational-run';
import {
  AutonomousExecutionOutcome,
  type AutonomousExecutionInput,
  type AutonomousExecutionResult,
} from './autonomous-execution-orchestrator';

export interface AutonomousExecutionRunner {
  execute(input: AutonomousExecutionInput): Promise<AutonomousExecutionResult>;
}

export interface ObservedAutonomousExecutionResult {
  readonly execution: AutonomousExecutionResult;
  readonly runRecord: OperationalRunRecord;
}

const OUTCOME_MAP: Readonly<Record<AutonomousExecutionOutcome, OperationalRunOutcome>> = {
  [AutonomousExecutionOutcome.SKIPPED]: OperationalRunOutcome.SKIPPED,
  [AutonomousExecutionOutcome.BLOCKED]: OperationalRunOutcome.BLOCKED,
  [AutonomousExecutionOutcome.DEFERRED]: OperationalRunOutcome.DEFERRED,
  [AutonomousExecutionOutcome.COMPLETED]: OperationalRunOutcome.COMPLETED,
  [AutonomousExecutionOutcome.FAILED]: OperationalRunOutcome.FAILED,
};

export const createObservedAutonomousExecution = ({
  runner,
  clock = () => new Date().toISOString() as IsoUtcDateTime,
  runIdFactory = () => `oprun-${randomUUID()}`,
}: {
  readonly runner: AutonomousExecutionRunner;
  readonly clock?: () => IsoUtcDateTime;
  readonly runIdFactory?: () => string;
}) => ({
  async execute(input: AutonomousExecutionInput): Promise<ObservedAutonomousExecutionResult> {
    const startedAt = clock();
    const execution = await runner.execute(input);
    const finishedAt = clock();

    const runRecord = createOperationalRunRecord({
      runId: runIdFactory(),
      organizationId: input.organizationId,
      workerId: input.workerId,
      job: input.job,
      action: input.action,
      scheduler: execution.scheduler,
      authority: execution.authority,
      leaseAttempt: execution.leaseAttempt,
      startedAt,
      finishedAt,
      outcome: OUTCOME_MAP[execution.outcome],
      reasons: execution.reasons,
    });

    return { execution, runRecord };
  },
});
