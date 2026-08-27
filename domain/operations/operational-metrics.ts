import type { IsoUtcDateTime } from '../common/types';
import { OperationalAction } from './operational-authority';
import { OperationalRunOutcome, type OperationalRunRecord } from './operational-run';
import { SchedulerJob } from './scheduler';

export interface OperationalOutcomeCounts {
  readonly total: number;
  readonly completed: number;
  readonly failed: number;
  readonly blocked: number;
  readonly deferred: number;
  readonly skipped: number;
}

export interface OperationalHealthSnapshot {
  readonly counts: OperationalOutcomeCounts;
  readonly terminalRuns: number;
  readonly successRate: number | null;
  readonly failureRate: number | null;
  readonly averageDurationMs: number | null;
  readonly retryRuns: number;
  readonly retryRate: number | null;
  readonly lastRunAt: IsoUtcDateTime | null;
  readonly lastSuccessfulRunAt: IsoUtcDateTime | null;
  readonly lastFailedRunAt: IsoUtcDateTime | null;
  readonly byJob: Readonly<Record<SchedulerJob, OperationalOutcomeCounts>>;
  readonly byAction: Readonly<Record<OperationalAction, OperationalOutcomeCounts>>;
}

const emptyCounts = (): OperationalOutcomeCounts => ({
  total: 0,
  completed: 0,
  failed: 0,
  blocked: 0,
  deferred: 0,
  skipped: 0,
});

const increment = (counts: OperationalOutcomeCounts, outcome: OperationalRunOutcome): OperationalOutcomeCounts => ({
  total: counts.total + 1,
  completed: counts.completed + (outcome === OperationalRunOutcome.COMPLETED ? 1 : 0),
  failed: counts.failed + (outcome === OperationalRunOutcome.FAILED ? 1 : 0),
  blocked: counts.blocked + (outcome === OperationalRunOutcome.BLOCKED ? 1 : 0),
  deferred: counts.deferred + (outcome === OperationalRunOutcome.DEFERRED ? 1 : 0),
  skipped: counts.skipped + (outcome === OperationalRunOutcome.SKIPPED ? 1 : 0),
});

const latest = (records: readonly OperationalRunRecord[], outcome?: OperationalRunOutcome): IsoUtcDateTime | null => {
  const filtered = outcome ? records.filter((record) => record.outcome === outcome) : records;
  if (filtered.length === 0) return null;
  return filtered.reduce((current, record) =>
    new Date(record.finishedAt).getTime() > new Date(current).getTime() ? record.finishedAt : current,
  filtered[0].finishedAt);
};

const rate = (numerator: number, denominator: number): number | null =>
  denominator === 0 ? null : Number((numerator / denominator).toFixed(4));

export const aggregateOperationalHealth = (
  records: readonly OperationalRunRecord[],
): OperationalHealthSnapshot => {
  let counts = emptyCounts();
  const byJob = Object.fromEntries(Object.values(SchedulerJob).map((job) => [job, emptyCounts()])) as Record<SchedulerJob, OperationalOutcomeCounts>;
  const byAction = Object.fromEntries(Object.values(OperationalAction).map((action) => [action, emptyCounts()])) as Record<OperationalAction, OperationalOutcomeCounts>;

  for (const record of records) {
    counts = increment(counts, record.outcome);
    byJob[record.job] = increment(byJob[record.job], record.outcome);
    byAction[record.action] = increment(byAction[record.action], record.outcome);
  }

  const terminalRuns = counts.completed + counts.failed;
  const retryRuns = records.filter((record) => (record.leaseAttempt ?? 0) > 1).length;
  const executedRuns = records.filter((record) => record.leaseAttempt !== null);
  const averageDurationMs = executedRuns.length === 0
    ? null
    : Number((executedRuns.reduce((sum, record) => sum + record.durationMs, 0) / executedRuns.length).toFixed(2));

  return {
    counts,
    terminalRuns,
    successRate: rate(counts.completed, terminalRuns),
    failureRate: rate(counts.failed, terminalRuns),
    averageDurationMs,
    retryRuns,
    retryRate: rate(retryRuns, executedRuns.length),
    lastRunAt: latest(records),
    lastSuccessfulRunAt: latest(records, OperationalRunOutcome.COMPLETED),
    lastFailedRunAt: latest(records, OperationalRunOutcome.FAILED),
    byJob,
    byAction,
  };
};
