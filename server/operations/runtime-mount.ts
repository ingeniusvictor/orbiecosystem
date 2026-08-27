import type { Express } from 'express';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import type { FirestoreSdkLoader } from '../editorial/firestore-sdk';
import type { AutonomousOperationHandler } from './autonomous-execution-orchestrator';
import { resolveProductionOperationalAuthoritySnapshot, type ProductionAuthorityEnvironment } from './production-authority-config';
import { createProductionAutonomousRuntime } from './production-runtime';
import { resolveProductionRuntimeConfiguration, type ProductionRuntimeEnvironment } from './production-runtime-config';
import { createSchedulerInvocationRouter, resolveSchedulerTransportToken, type SchedulerTransportEnvironment } from './scheduler-transport';

export interface ProductionNewsRuntimeEnvironment
  extends ProductionRuntimeEnvironment, ProductionAuthorityEnvironment, SchedulerTransportEnvironment {}

export interface ProductionNewsRuntimeMountOptions {
  readonly handler: AutonomousOperationHandler;
  readonly firestore?: FirestoreClientLike;
  readonly firestoreSdkLoader?: FirestoreSdkLoader;
}

/**
 * Mounts the internal scheduler transport only when the autonomous runtime is explicitly enabled.
 * No default provider handler exists: callers must inject one deliberately.
 */
export const mountProductionNewsRuntimeIfConfigured = (
  app: Express,
  environment: ProductionNewsRuntimeEnvironment,
  options: ProductionNewsRuntimeMountOptions,
): boolean => {
  const configuration = resolveProductionRuntimeConfiguration(environment);
  if (!configuration.enabled) return false;

  const token = resolveSchedulerTransportToken(environment);
  const authoritySnapshot = resolveProductionOperationalAuthoritySnapshot({
    runtime: configuration,
    environment,
  });
  const runtime = createProductionAutonomousRuntime({
    environment,
    handler: options.handler,
    ...(options.firestore ? { firestore: options.firestore } : {}),
    ...(options.firestoreSdkLoader ? { firestoreSdkLoader: options.firestoreSdkLoader } : {}),
  });
  if (!runtime) throw new Error('ORBI_NEWS_RUNTIME_UNEXPECTEDLY_DISABLED');

  app.use('/api/internal/orbi-news-scheduler', createSchedulerInvocationRouter({
    runtime,
    authoritySnapshot,
    token,
  }));
  return true;
};
