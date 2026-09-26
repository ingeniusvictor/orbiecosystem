import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runVercelDiscoveryPreflight,
  type VercelDiscoveryEnvironment,
} from '../server/vercel/discovery-cron-service';

export interface VercelDiscoveryPreflightReport {
  readonly stage: 'DISCOVERY_ONLY';
  readonly ready: boolean;
  readonly profile: string;
  readonly sourceCount: number;
  readonly rssSourceCount: number;
  readonly reasons: readonly string[];
  readonly fatalError: string | null;
  readonly configurationPresent: {
    readonly nodeEnvProduction: boolean;
    readonly runtimeEnabled: boolean;
    readonly organizationId: boolean;
    readonly workerId: boolean;
    readonly firestoreEnabled: boolean;
    readonly firestoreProjectId: boolean;
    readonly cronSecret: boolean;
    readonly sourceRegistry: boolean;
  };
}

const present = (value: string | undefined): boolean => Boolean(value?.trim());

export const buildVercelDiscoveryPreflightReport = (
  environment: VercelDiscoveryEnvironment,
): VercelDiscoveryPreflightReport => {
  const configurationPresent = {
    nodeEnvProduction: environment.NODE_ENV?.trim() === 'production',
    runtimeEnabled: environment.ORBI_NEWS_RUNTIME_ENABLED?.trim().toLowerCase() === 'true',
    organizationId: present(environment.ORBI_NEWS_ORGANIZATION_ID),
    workerId: present(environment.ORBI_NEWS_WORKER_ID),
    firestoreEnabled: environment.ORBI_EDITORIAL_FIRESTORE_ENABLED?.trim().toLowerCase() === 'true',
    firestoreProjectId: present(environment.ORBI_EDITORIAL_FIRESTORE_PROJECT_ID),
    cronSecret: present(environment.CRON_SECRET),
    sourceRegistry: present(environment.ORBI_NEWS_SOURCE_REGISTRY_JSON),
  };

  try {
    const preflight = runVercelDiscoveryPreflight(environment);
    return {
      stage: 'DISCOVERY_ONLY',
      ready: preflight.ready,
      profile: environment.ORBI_NEWS_ACTIVATION_PROFILE?.trim() || 'DISABLED',
      sourceCount: preflight.sourceCount,
      rssSourceCount: preflight.rssSourceCount,
      reasons: preflight.reasons,
      fatalError: null,
      configurationPresent,
    };
  } catch (error) {
    return {
      stage: 'DISCOVERY_ONLY',
      ready: false,
      profile: environment.ORBI_NEWS_ACTIVATION_PROFILE?.trim() || 'DISABLED',
      sourceCount: 0,
      rssSourceCount: 0,
      reasons: ['VERCEL_DISCOVERY_PREFLIGHT_EXCEPTION'],
      fatalError: error instanceof Error ? error.message : 'VERCEL_DISCOVERY_PREFLIGHT_UNKNOWN_ERROR',
      configurationPresent,
    };
  }
};

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = buildVercelDiscoveryPreflightReport(process.env);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.ready ? 0 : 1;
}
