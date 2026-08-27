import type { Express } from 'express';
import { RssDiscoveryProvider } from '../../domain/discovery/rss-provider';
import { OperationalAction } from '../../domain/operations/operational-authority';
import { createConfiguredFirestoreClient, type FirestoreSdkLoader } from '../editorial/firestore-sdk';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import { createInMemorySourceRegistry, parseEnvironmentSourceRegistry } from '../discovery/environment-source-registry';
import { createFetchRssFeedClient, type FetchRssFeedClientOptions } from '../discovery/fetch-rss-feed-client';
import { createFirestoreDiscoverySink } from '../discovery/firestore-discovery-sink';
import { ControlledActivationProfile } from './controlled-activation-profile';
import { runControlledActivationPreflight, type ControlledActivationEnvironment } from './controlled-activation-preflight';
import { createProductionDiscoveryHandler } from './production-discovery-handler';
import { createProductionOperationHandler } from './production-handler-registry';
import { mountProductionNewsRuntimeIfConfigured } from './runtime-mount';

export interface ControlledDiscoveryMountOptions {
  readonly firestore?: FirestoreClientLike;
  readonly firestoreSdkLoader?: FirestoreSdkLoader;
  readonly rss?: FetchRssFeedClientOptions;
}

/**
 * Final NA-12 discovery-only composition. It mounts nothing unless profile is
 * DISCOVERY_ONLY and the side-effect-free preflight is fully ready.
 */
export const mountControlledDiscoveryRuntimeIfConfigured = (
  app: Express,
  environment: ControlledActivationEnvironment,
  options: ControlledDiscoveryMountOptions = {},
): boolean => {
  const profile = (environment.ORBI_NEWS_ACTIVATION_PROFILE?.trim() || ControlledActivationProfile.DISABLED) as ControlledActivationProfile;
  if (profile === ControlledActivationProfile.DISABLED) return false;

  const preflight = runControlledActivationPreflight(environment);
  if (!preflight.ready) throw new Error(`ORBI_NEWS_CONTROLLED_ACTIVATION_NOT_READY:${preflight.reasons.join(',')}`);

  const firestore = options.firestore ?? createConfiguredFirestoreClient(environment, options.firestoreSdkLoader);
  if (!firestore) throw new Error('ORBI_NEWS_CONTROLLED_ACTIVATION_FIRESTORE_REQUIRED');

  const entries = parseEnvironmentSourceRegistry(environment);
  const registry = createInMemorySourceRegistry(entries);
  const clock = { now: () => new Date().toISOString() as any };
  const provider = new RssDiscoveryProvider(registry, createFetchRssFeedClient(options.rss), clock);
  const sink = createFirestoreDiscoverySink({ firestore });
  const discoveryHandler = createProductionDiscoveryHandler({ provider, sink });
  const handler = createProductionOperationHandler({ [OperationalAction.DISCOVER_NEWS]: discoveryHandler });

  return mountProductionNewsRuntimeIfConfigured(app, environment, { handler, firestore });
};
