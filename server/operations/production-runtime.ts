import type { IsoUtcDateTime } from '../../domain/common/types';
import type { OperationalAuthoritySnapshot, OperationalAction } from '../../domain/operations/operational-authority';
import type { SchedulerJob } from '../../domain/operations/scheduler';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import { createConfiguredFirestoreClient, type FirestoreSdkLoader } from '../editorial/firestore-sdk';
import { createAutonomousExecutionOrchestrator, type AutonomousOperationHandler } from './autonomous-execution-orchestrator';
import { createAutonomousRuntime } from './autonomous-runtime';
import { createFirestoreExecutionLeasePersistence } from './firestore-execution-lease-persistence';
import { createFirestoreOperationalRunLedger } from './firestore-operational-run-ledger';
import {
  resolveProductionRuntimeConfiguration,
  type ProductionRuntimeConfiguration,
  type ProductionRuntimeEnvironment,
} from './production-runtime-config';

export interface ProductionAutonomousRuntimeInput {
  readonly job: SchedulerJob;
  readonly action: OperationalAction;
  readonly nowUtc: IsoUtcDateTime;
  readonly breakingEligible?: boolean;
  readonly authoritySnapshot: OperationalAuthoritySnapshot;
}

export interface ProductionAutonomousRuntime {
  readonly configuration: ProductionRuntimeConfiguration;
  execute(input: ProductionAutonomousRuntimeInput): ReturnType<ReturnType<typeof createAutonomousRuntime>['execute']>;
}

/**
 * Server-only composition root for NA-11 production operations.
 * It creates durable lease + ledger dependencies from one Firestore client.
 * No scheduler transport or provider is activated by constructing this runtime.
 */
export const createProductionAutonomousRuntime = ({
  environment,
  handler,
  firestore,
  firestoreSdkLoader,
  clock,
  runIdFactory,
}: {
  readonly environment: ProductionRuntimeEnvironment;
  readonly handler: AutonomousOperationHandler;
  readonly firestore?: FirestoreClientLike;
  readonly firestoreSdkLoader?: FirestoreSdkLoader;
  readonly clock?: () => IsoUtcDateTime;
  readonly runIdFactory?: () => string;
}): ProductionAutonomousRuntime | null => {
  const configuration = resolveProductionRuntimeConfiguration(environment);
  if (!configuration.enabled) return null;

  const durableFirestore = firestore ?? createConfiguredFirestoreClient(
    environment,
    firestoreSdkLoader,
  );
  if (!durableFirestore) throw new Error('ORBI_NEWS_RUNTIME_FIRESTORE_REQUIRED');
  if (!configuration.organizationId || !configuration.workerId) {
    throw new Error('ORBI_NEWS_RUNTIME_IDENTITY_REQUIRED');
  }

  const leasePersistence = createFirestoreExecutionLeasePersistence({ firestore: durableFirestore });
  const ledger = createFirestoreOperationalRunLedger({ firestore: durableFirestore });
  const orchestrator = createAutonomousExecutionOrchestrator({ leasePersistence, handler });
  const runtime = createAutonomousRuntime({
    ledger,
    runner: orchestrator,
    ...(clock ? { clock } : {}),
    ...(runIdFactory ? { runIdFactory } : {}),
  });

  return {
    configuration,
    execute(input) {
      return runtime.execute({
        organizationId: configuration.organizationId!,
        workerId: configuration.workerId!,
        job: input.job,
        action: input.action,
        nowUtc: input.nowUtc,
        ...(input.breakingEligible !== undefined ? { breakingEligible: input.breakingEligible } : {}),
        authoritySnapshot: input.authoritySnapshot,
        leaseDurationSeconds: configuration.leaseDurationSeconds,
        maxAttempts: configuration.maxAttempts,
      });
    },
  };
};
