import { RssDiscoveryProvider } from '../../domain/discovery/rss-provider';
import { NewsOrigin } from '../../domain/news/news-item';
import { OperationalAction } from '../../domain/operations/operational-authority';
import { SchedulerJob } from '../../domain/operations/scheduler';
import type { IsoUtcDateTime } from '../../domain/common/types';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import { createConfiguredFirestoreClient, type FirestoreSdkLoader } from '../editorial/firestore-sdk';
import { createInMemorySourceRegistry, parseEnvironmentSourceRegistry } from '../discovery/environment-source-registry';
import { createFetchRssFeedClient, type FetchRssFeedClientOptions } from '../discovery/fetch-rss-feed-client';
import { createFirestoreDiscoverySink } from '../discovery/firestore-discovery-sink';
import { ControlledActivationProfile, assessControlledActivationProfile } from '../operations/controlled-activation-profile';
import { resolveProductionOperationalAuthoritySnapshot } from '../operations/production-authority-config';
import { createProductionDiscoveryHandler } from '../operations/production-discovery-handler';
import { createProductionOperationHandler } from '../operations/production-handler-registry';
import { createProductionAutonomousRuntime } from '../operations/production-runtime';
import { resolveProductionRuntimeConfiguration } from '../operations/production-runtime-config';
import type { ControlledActivationEnvironment } from '../operations/controlled-activation-preflight';
import { SourceRegistryStatus } from '../../domain/discovery/source-registry';
import type { VercelCronEnvironment } from './cron-auth';
import { resolveVercelCronSecret } from './cron-auth';

export interface VercelDiscoveryEnvironment extends ControlledActivationEnvironment, VercelCronEnvironment {}

export interface VercelDiscoveryPreflight {
  readonly ready: boolean;
  readonly reasons: readonly string[];
  readonly sourceCount: number;
  readonly rssSourceCount: number;
}

export const runVercelDiscoveryPreflight = (environment: VercelDiscoveryEnvironment): VercelDiscoveryPreflight => {
  const runtime = resolveProductionRuntimeConfiguration(environment);
  const profileRaw = environment.ORBI_NEWS_ACTIVATION_PROFILE?.trim() || ControlledActivationProfile.DISABLED;
  if (!Object.values(ControlledActivationProfile).includes(profileRaw as ControlledActivationProfile)) {
    throw new RangeError('ORBI_NEWS_ACTIVATION_PROFILE_INVALID');
  }
  const profile = profileRaw as ControlledActivationProfile;
  const activation = assessControlledActivationProfile({ profile, runtime, authorityEnvironment: environment });
  const sources = parseEnvironmentSourceRegistry(environment);
  const rssSourceCount = sources.filter((source) =>
    source.status === SourceRegistryStatus.ACTIVE &&
    source.allowedOrigins.includes(NewsOrigin.RSS) &&
    source.feedUrl !== null,
  ).length;
  const reasons = [...activation.reasons];

  if (
    profile !== ControlledActivationProfile.DISCOVERY_ONLY &&
    profile !== ControlledActivationProfile.EDITORIAL_ASSISTED &&
    profile !== ControlledActivationProfile.WEB_AUTONOMOUS
  ) {
    reasons.push('VERCEL_DISCOVERY_PROFILE_NOT_ALLOWED');
  }
  try { resolveVercelCronSecret(environment); } catch { reasons.push('VERCEL_DISCOVERY_CRON_SECRET_REQUIRED'); }
  if (sources.length === 0) reasons.push('VERCEL_DISCOVERY_SOURCE_REGISTRY_REQUIRED');
  if (rssSourceCount === 0) reasons.push('VERCEL_DISCOVERY_ACTIVE_RSS_SOURCE_REQUIRED');
  if (runtime.organizationId && sources.some((source) => source.organizationId !== runtime.organizationId)) {
    reasons.push('VERCEL_DISCOVERY_SOURCE_ORGANIZATION_MISMATCH');
  }

  return { ready: reasons.length === 0, reasons: [...new Set(reasons)], sourceCount: sources.length, rssSourceCount };
};

export const executeVercelDiscoveryCron = async ({
  environment,
  firestore,
  firestoreSdkLoader,
  rss,
  nowUtc = new Date().toISOString() as IsoUtcDateTime,
}: {
  readonly environment: VercelDiscoveryEnvironment;
  readonly firestore?: FirestoreClientLike;
  readonly firestoreSdkLoader?: FirestoreSdkLoader;
  readonly rss?: FetchRssFeedClientOptions;
  readonly nowUtc?: IsoUtcDateTime;
}) => {
  const preflight = runVercelDiscoveryPreflight(environment);
  if (!preflight.ready) throw new Error(`VERCEL_DISCOVERY_NOT_READY:${preflight.reasons.join(',')}`);

  const durableFirestore = firestore ?? createConfiguredFirestoreClient(environment, firestoreSdkLoader);
  if (!durableFirestore) throw new Error('VERCEL_DISCOVERY_FIRESTORE_REQUIRED');

  const entries = parseEnvironmentSourceRegistry(environment);
  const registry = createInMemorySourceRegistry(entries);
  const clock = { now: () => nowUtc };
  const provider = new RssDiscoveryProvider(registry, createFetchRssFeedClient(rss), clock);
  const sink = createFirestoreDiscoverySink({ firestore: durableFirestore });
  const discoveryHandler = createProductionDiscoveryHandler({ provider, sink });
  const handler = createProductionOperationHandler({ [OperationalAction.DISCOVER_NEWS]: discoveryHandler });
  const runtimeConfig = resolveProductionRuntimeConfiguration(environment);
  const authoritySnapshot = resolveProductionOperationalAuthoritySnapshot({ runtime: runtimeConfig, environment });
  const runtime = createProductionAutonomousRuntime({ environment, handler, firestore: durableFirestore });
  if (!runtime) throw new Error('VERCEL_DISCOVERY_RUNTIME_DISABLED');

  return runtime.execute({
    job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS,
    nowUtc,
    authoritySnapshot,
  });
};
