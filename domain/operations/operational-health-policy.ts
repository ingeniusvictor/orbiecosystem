import { AutonomyLevel } from '../common/enums';
import type { IsoUtcDateTime } from '../common/types';
import type { OperationalHealthSnapshot } from './operational-metrics';
import { OperationalRunOutcome, type OperationalRunRecord } from './operational-run';

export enum OperationalHealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  CRITICAL = 'CRITICAL',
}

export interface OperationalHealthPolicyConfig {
  readonly minimumTerminalSample: number;
  readonly degradedFailureRate: number;
  readonly criticalFailureRate: number;
  readonly degradedRetryRate: number;
  readonly criticalRetryRate: number;
  readonly degradedFailureStreak: number;
  readonly criticalFailureStreak: number;
  readonly degradedNoSuccessHours: number;
  readonly criticalNoSuccessHours: number;
}

export interface OperationalHealthAssessment {
  readonly status: OperationalHealthStatus;
  readonly reasons: readonly string[];
  readonly failureStreak: number;
  readonly hoursSinceLastSuccess: number | null;
  readonly recommendedAutonomyCeiling: AutonomyLevel | null;
}

export const DEFAULT_OPERATIONAL_HEALTH_POLICY: OperationalHealthPolicyConfig = {
  minimumTerminalSample: 4,
  degradedFailureRate: 0.25,
  criticalFailureRate: 0.5,
  degradedRetryRate: 0.3,
  criticalRetryRate: 0.6,
  degradedFailureStreak: 3,
  criticalFailureStreak: 5,
  degradedNoSuccessHours: 6,
  criticalNoSuccessHours: 24,
};

const assertRate = (label: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new RangeError(`${label} must be between 0 and 1.`);
};

const assertPositive = (label: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be greater than zero.`);
};

const validateConfig = (config: OperationalHealthPolicyConfig): void => {
  if (!Number.isInteger(config.minimumTerminalSample) || config.minimumTerminalSample < 1) {
    throw new RangeError('minimumTerminalSample must be a positive integer.');
  }
  assertRate('degradedFailureRate', config.degradedFailureRate);
  assertRate('criticalFailureRate', config.criticalFailureRate);
  assertRate('degradedRetryRate', config.degradedRetryRate);
  assertRate('criticalRetryRate', config.criticalRetryRate);
  if (config.criticalFailureRate < config.degradedFailureRate) throw new RangeError('criticalFailureRate cannot be below degradedFailureRate.');
  if (config.criticalRetryRate < config.degradedRetryRate) throw new RangeError('criticalRetryRate cannot be below degradedRetryRate.');
  for (const [label, value] of [
    ['degradedFailureStreak', config.degradedFailureStreak],
    ['criticalFailureStreak', config.criticalFailureStreak],
  ] as const) {
    if (!Number.isInteger(value) || value < 1) throw new RangeError(`${label} must be a positive integer.`);
  }
  if (config.criticalFailureStreak < config.degradedFailureStreak) throw new RangeError('criticalFailureStreak cannot be below degradedFailureStreak.');
  assertPositive('degradedNoSuccessHours', config.degradedNoSuccessHours);
  assertPositive('criticalNoSuccessHours', config.criticalNoSuccessHours);
  if (config.criticalNoSuccessHours < config.degradedNoSuccessHours) throw new RangeError('criticalNoSuccessHours cannot be below degradedNoSuccessHours.');
};

const terminalFailureStreak = (records: readonly OperationalRunRecord[]): number => {
  const terminal = records
    .filter((record) => record.outcome === OperationalRunOutcome.COMPLETED || record.outcome === OperationalRunOutcome.FAILED)
    .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());
  let streak = 0;
  for (const record of terminal) {
    if (record.outcome !== OperationalRunOutcome.FAILED) break;
    streak += 1;
  }
  return streak;
};

const hoursSince = (nowUtc: IsoUtcDateTime, earlier: IsoUtcDateTime | null): number | null => {
  if (earlier === null) return null;
  const now = new Date(nowUtc).getTime();
  const before = new Date(earlier).getTime();
  if (!Number.isFinite(now) || !Number.isFinite(before)) throw new RangeError('Operational health timestamps must be valid.');
  if (before > now) throw new RangeError('OPERATIONAL_HEALTH_LAST_SUCCESS_IN_FUTURE');
  return Number(((now - before) / 3_600_000).toFixed(2));
};

/** Observability policy only. It may recommend reducing autonomy, never increasing it. */
export const assessOperationalHealth = ({
  snapshot,
  records,
  nowUtc,
  config = DEFAULT_OPERATIONAL_HEALTH_POLICY,
}: {
  readonly snapshot: OperationalHealthSnapshot;
  readonly records: readonly OperationalRunRecord[];
  readonly nowUtc: IsoUtcDateTime;
  readonly config?: OperationalHealthPolicyConfig;
}): OperationalHealthAssessment => {
  validateConfig(config);
  const failureStreak = terminalFailureStreak(records);
  const hoursSinceLastSuccess = hoursSince(nowUtc, snapshot.lastSuccessfulRunAt);
  const degraded: string[] = [];
  const critical: string[] = [];

  if (snapshot.terminalRuns >= config.minimumTerminalSample && snapshot.failureRate !== null) {
    if (snapshot.failureRate >= config.criticalFailureRate) critical.push('CRITICAL_FAILURE_RATE');
    else if (snapshot.failureRate >= config.degradedFailureRate) degraded.push('DEGRADED_FAILURE_RATE');
  }

  if (snapshot.terminalRuns >= config.minimumTerminalSample && snapshot.retryRate !== null) {
    if (snapshot.retryRate >= config.criticalRetryRate) critical.push('CRITICAL_RETRY_PRESSURE');
    else if (snapshot.retryRate >= config.degradedRetryRate) degraded.push('DEGRADED_RETRY_PRESSURE');
  }

  if (failureStreak >= config.criticalFailureStreak) critical.push('CRITICAL_FAILURE_STREAK');
  else if (failureStreak >= config.degradedFailureStreak) degraded.push('DEGRADED_FAILURE_STREAK');

  if (snapshot.counts.total > 0 && hoursSinceLastSuccess !== null) {
    if (hoursSinceLastSuccess >= config.criticalNoSuccessHours) critical.push('CRITICAL_NO_RECENT_SUCCESS');
    else if (hoursSinceLastSuccess >= config.degradedNoSuccessHours) degraded.push('DEGRADED_NO_RECENT_SUCCESS');
  }

  if (critical.length > 0) {
    return {
      status: OperationalHealthStatus.CRITICAL,
      reasons: [...new Set([...critical, ...degraded])],
      failureStreak,
      hoursSinceLastSuccess,
      recommendedAutonomyCeiling: AutonomyLevel.LEVEL_1,
    };
  }
  if (degraded.length > 0) {
    return {
      status: OperationalHealthStatus.DEGRADED,
      reasons: [...new Set(degraded)],
      failureStreak,
      hoursSinceLastSuccess,
      recommendedAutonomyCeiling: AutonomyLevel.LEVEL_3,
    };
  }
  return {
    status: OperationalHealthStatus.HEALTHY,
    reasons: [],
    failureStreak,
    hoursSinceLastSuccess,
    recommendedAutonomyCeiling: null,
  };
};
