import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import { constrainAutonomyByHealth, type HealthConstrainedAutonomyResult } from '../../domain/operations/health-constrained-authority';
import { assessOperationalHealth, type OperationalHealthAssessment, type OperationalHealthPolicyConfig } from '../../domain/operations/operational-health-policy';
import { aggregateOperationalHealth, type OperationalHealthSnapshot } from '../../domain/operations/operational-metrics';
import { OperationalRunOutcome, type OperationalRunRecord } from '../../domain/operations/operational-run';
import type { OperationalAuthoritySnapshot, OperationalAction } from '../../domain/operations/operational-authority';
import type { SchedulerJob } from '../../domain/operations/scheduler';
import {
  createObservedAutonomousExecution,
  type AutonomousExecutionRunner,
  type ObservedAutonomousExecutionResult,
} from './observed-autonomous-execution';
import type { OperationalRunLedger } from './firestore-operational-run-ledger';

export interface AutonomousRuntimeInput {
  readonly organizationId: OrganizationId;
  readonly workerId: string;
  readonly job: SchedulerJob;
  readonly action: OperationalAction;
  readonly nowUtc: IsoUtcDateTime;
  readonly breakingEligible?: boolean;
  readonly authoritySnapshot: OperationalAuthoritySnapshot;
  readonly leaseDurationSeconds: number;
  readonly maxAttempts: number;
}

export interface AutonomousRuntimeResult extends ObservedAutonomousExecutionResult {
  readonly healthSnapshot: OperationalHealthSnapshot;
  readonly healthAssessment: OperationalHealthAssessment;
  readonly autonomy: HealthConstrainedAutonomyResult;
  readonly priorRunCount: number;
}

const completedTickKeysFrom = (records: readonly OperationalRunRecord[]): readonly string[] =>
  [...new Set(records
    .filter((record) => record.outcome === OperationalRunOutcome.COMPLETED)
    .map((record) => record.tickKey))];

/**
 * Composes historical observability with health-constrained authority before execution.
 * The runtime coordinates existing contracts; it does not create editorial/publication authority.
 */
export const createAutonomousRuntime = ({
  ledger,
  runner,
  clock = () => new Date().toISOString() as IsoUtcDateTime,
  runIdFactory,
  healthPolicy,
}: {
  readonly ledger: OperationalRunLedger;
  readonly runner: AutonomousExecutionRunner;
  readonly clock?: () => IsoUtcDateTime;
  readonly runIdFactory?: () => string;
  readonly healthPolicy?: OperationalHealthPolicyConfig;
}) => {
  const observed = createObservedAutonomousExecution({
    runner,
    clock,
    ...(runIdFactory ? { runIdFactory } : {}),
  });

  return {
    async execute(input: AutonomousRuntimeInput): Promise<AutonomousRuntimeResult> {
      // Ledger read is intentionally before scheduler/handler execution. If history cannot
      // be reconstructed safely, the autonomous attempt fails closed before side effects.
      const priorRuns = await ledger.listByOrganization(input.organizationId);
      const healthSnapshot = aggregateOperationalHealth(priorRuns);
      const healthAssessment = assessOperationalHealth({
        snapshot: healthSnapshot,
        records: priorRuns,
        nowUtc: input.nowUtc,
        ...(healthPolicy ? { config: healthPolicy } : {}),
      });
      const autonomy = constrainAutonomyByHealth(input.authoritySnapshot.autonomyLevel, healthAssessment);

      const observedResult = await observed.execute({
        organizationId: input.organizationId,
        workerId: input.workerId,
        job: input.job,
        action: input.action,
        nowUtc: input.nowUtc,
        completedTickKeys: completedTickKeysFrom(priorRuns),
        ...(input.breakingEligible !== undefined ? { breakingEligible: input.breakingEligible } : {}),
        authoritySnapshot: {
          ...input.authoritySnapshot,
          autonomyLevel: autonomy.effectiveAutonomyLevel,
        },
        leaseDurationSeconds: input.leaseDurationSeconds,
        maxAttempts: input.maxAttempts,
      });

      // Append-only audit is mandatory after every scheduler/authority outcome, including
      // SKIPPED/BLOCKED/DEFERRED. Failure is surfaced; execution is never falsely reported
      // as durably audited when the ledger write did not succeed.
      await ledger.append(observedResult.runRecord);

      return {
        ...observedResult,
        healthSnapshot,
        healthAssessment,
        autonomy,
        priorRunCount: priorRuns.length,
      };
    },
  };
};
