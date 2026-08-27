import type { IsoUtcDateTime, OrganizationId } from '../common/types';
import { OperationalAction, OperationalDecision, type OperationalAuthorityAssessment } from './operational-authority';
import { SchedulerDecision, SchedulerJob, type SchedulerTickResult } from './scheduler';

export enum OperationalRunOutcome {
  SKIPPED = 'SKIPPED',
  BLOCKED = 'BLOCKED',
  DEFERRED = 'DEFERRED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface OperationalRunRecord {
  readonly runId: string;
  readonly organizationId: OrganizationId;
  readonly workerId: string;
  readonly tickKey: string;
  readonly job: SchedulerJob;
  readonly action: OperationalAction;
  readonly schedulerDecision: SchedulerDecision;
  readonly authorityDecision: OperationalDecision | null;
  readonly leaseAttempt: number | null;
  readonly startedAt: IsoUtcDateTime;
  readonly finishedAt: IsoUtcDateTime;
  readonly durationMs: number;
  readonly outcome: OperationalRunOutcome;
  readonly reasons: readonly string[];
}

const required = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label} is required.`);
  return normalized;
};

const parseInstant = (label: string, value: IsoUtcDateTime): Date => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new RangeError(`${label} is invalid.`);
  return date;
};

export const createOperationalRunRecord = ({
  runId,
  organizationId,
  workerId,
  job,
  action,
  scheduler,
  authority,
  leaseAttempt,
  startedAt,
  finishedAt,
  outcome,
  reasons,
}: {
  readonly runId: string;
  readonly organizationId: OrganizationId;
  readonly workerId: string;
  readonly job: SchedulerJob;
  readonly action: OperationalAction;
  readonly scheduler: SchedulerTickResult;
  readonly authority: OperationalAuthorityAssessment | null;
  readonly leaseAttempt: number | null;
  readonly startedAt: IsoUtcDateTime;
  readonly finishedAt: IsoUtcDateTime;
  readonly outcome: OperationalRunOutcome;
  readonly reasons: readonly string[];
}): OperationalRunRecord => {
  const started = parseInstant('Operational run startedAt', startedAt);
  const finished = parseInstant('Operational run finishedAt', finishedAt);
  if (finished.getTime() < started.getTime()) throw new RangeError('OPERATIONAL_RUN_FINISHED_BEFORE_STARTED');
  if (leaseAttempt !== null && (!Number.isInteger(leaseAttempt) || leaseAttempt <= 0)) {
    throw new RangeError('OPERATIONAL_RUN_LEASE_ATTEMPT_INVALID');
  }
  if (scheduler.tickKey.trim().length === 0) throw new RangeError('OPERATIONAL_RUN_TICK_KEY_REQUIRED');
  if (authority && authority.action !== action) throw new RangeError('OPERATIONAL_RUN_AUTHORITY_ACTION_MISMATCH');
  if (authority === null && ![SchedulerDecision.NOT_DUE, SchedulerDecision.DUPLICATE_TICK].includes(scheduler.decision)) {
    throw new RangeError('OPERATIONAL_RUN_AUTHORITY_REQUIRED');
  }
  if (outcome === OperationalRunOutcome.COMPLETED && leaseAttempt === null) {
    throw new RangeError('OPERATIONAL_RUN_COMPLETED_REQUIRES_LEASE_ATTEMPT');
  }

  return {
    runId: required('Operational run id', runId),
    organizationId,
    workerId: required('Operational worker id', workerId),
    tickKey: scheduler.tickKey,
    job,
    action,
    schedulerDecision: scheduler.decision,
    authorityDecision: authority?.decision ?? null,
    leaseAttempt,
    startedAt,
    finishedAt,
    durationMs: finished.getTime() - started.getTime(),
    outcome,
    reasons: [...new Set(reasons.map((reason) => reason.trim()).filter(Boolean))],
  };
};
