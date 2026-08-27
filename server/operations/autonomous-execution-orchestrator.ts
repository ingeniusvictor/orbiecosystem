import type { OrganizationId, IsoUtcDateTime } from '../../domain/common/types';
import { OperationalAction, OperationalDecision, assessOperationalAuthority, type OperationalAuthorityAssessment, type OperationalAuthoritySnapshot } from '../../domain/operations/operational-authority';
import { SchedulerDecision, SchedulerJob, evaluateSchedulerTick, type SchedulerTickResult } from '../../domain/operations/scheduler';
import type { DurableExecutionLeasePersistence } from './firestore-execution-lease-persistence';

export enum AutonomousExecutionOutcome {
  SKIPPED = 'SKIPPED',
  BLOCKED = 'BLOCKED',
  DEFERRED = 'DEFERRED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface AutonomousOperationHandlerContext {
  readonly organizationId: OrganizationId;
  readonly workerId: string;
  readonly job: SchedulerJob;
  readonly action: OperationalAction;
  readonly tickKey: string;
  readonly nowUtc: IsoUtcDateTime;
}

export type AutonomousOperationHandler = (context: AutonomousOperationHandlerContext) => Promise<void>;

export interface AutonomousExecutionInput {
  readonly organizationId: OrganizationId;
  readonly workerId: string;
  readonly job: SchedulerJob;
  readonly action: OperationalAction;
  readonly nowUtc: IsoUtcDateTime;
  readonly completedTickKeys: readonly string[];
  readonly breakingEligible?: boolean;
  readonly authoritySnapshot: OperationalAuthoritySnapshot;
  readonly leaseDurationSeconds: number;
  readonly maxAttempts: number;
}

export interface AutonomousExecutionResult {
  readonly outcome: AutonomousExecutionOutcome;
  readonly scheduler: SchedulerTickResult;
  readonly authority: OperationalAuthorityAssessment | null;
  readonly tickKey: string;
  readonly reasons: readonly string[];
}

const JOB_ACTION: Readonly<Record<SchedulerJob, OperationalAction>> = {
  [SchedulerJob.DISCOVERY_RADAR]: OperationalAction.DISCOVER_NEWS,
  [SchedulerJob.SOCIAL_DIGEST]: OperationalAction.PREPARE_SOCIAL,
  [SchedulerJob.BREAKING_SOCIAL]: OperationalAction.PREPARE_SOCIAL,
};

const required = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label} is required.`);
  return normalized;
};

const failureReasonFrom = (error: unknown): string =>
  error instanceof Error && error.message.trim()
    ? error.message.trim().slice(0, 500)
    : 'AUTONOMOUS_OPERATION_HANDLER_FAILED';

export const createAutonomousExecutionOrchestrator = ({ leasePersistence, handler }: {
  readonly leasePersistence: DurableExecutionLeasePersistence;
  readonly handler: AutonomousOperationHandler;
}) => ({
  async execute(input: AutonomousExecutionInput): Promise<AutonomousExecutionResult> {
    const workerId = required('Autonomous worker id', input.workerId);
    if (JOB_ACTION[input.job] !== input.action) throw new RangeError('AUTONOMOUS_JOB_ACTION_MISMATCH');

    const scheduler = evaluateSchedulerTick({
      job: input.job,
      nowUtc: input.nowUtc,
      completedTickKeys: input.completedTickKeys,
      ...(input.breakingEligible !== undefined ? { breakingEligible: input.breakingEligible } : {}),
    });

    if (scheduler.decision === SchedulerDecision.NOT_DUE || scheduler.decision === SchedulerDecision.DUPLICATE_TICK) {
      return { outcome: AutonomousExecutionOutcome.SKIPPED, scheduler, authority: null, tickKey: scheduler.tickKey, reasons: scheduler.reasons };
    }

    const authority = assessOperationalAuthority(input.action, input.authoritySnapshot);
    if (authority.decision === OperationalDecision.BLOCK) {
      return { outcome: AutonomousExecutionOutcome.BLOCKED, scheduler, authority, tickKey: scheduler.tickKey, reasons: authority.reasons };
    }
    if (authority.decision === OperationalDecision.DEFER) {
      return { outcome: AutonomousExecutionOutcome.DEFERRED, scheduler, authority, tickKey: scheduler.tickKey, reasons: authority.reasons };
    }

    let claimed = false;
    try {
      await leasePersistence.claim({ organizationId: input.organizationId, tickKey: scheduler.tickKey, workerId, nowUtc: input.nowUtc, leaseDurationSeconds: input.leaseDurationSeconds, maxAttempts: input.maxAttempts });
      claimed = true;
      await handler({ organizationId: input.organizationId, workerId, job: input.job, action: input.action, tickKey: scheduler.tickKey, nowUtc: input.nowUtc });
      await leasePersistence.complete({ organizationId: input.organizationId, tickKey: scheduler.tickKey, workerId, completedAt: input.nowUtc });
      return { outcome: AutonomousExecutionOutcome.COMPLETED, scheduler, authority, tickKey: scheduler.tickKey, reasons: [] };
    } catch (error) {
      const reason = failureReasonFrom(error);
      if (claimed) {
        try {
          await leasePersistence.fail({ organizationId: input.organizationId, tickKey: scheduler.tickKey, workerId, failedAt: input.nowUtc, failureReason: reason });
        } catch {
          return { outcome: AutonomousExecutionOutcome.FAILED, scheduler, authority, tickKey: scheduler.tickKey, reasons: [reason, 'AUTONOMOUS_EXECUTION_FAILURE_PERSISTENCE_FAILED'] };
        }
      }
      return { outcome: AutonomousExecutionOutcome.FAILED, scheduler, authority, tickKey: scheduler.tickKey, reasons: [reason] };
    }
  },
});
