import { NewsOrigin } from '../../domain/news/news-item';
import { SourceRegistryStatus, type SourceRegistryEntry } from '../../domain/discovery/source-registry';
import { ControlledActivationProfile, assessControlledActivationProfile } from './controlled-activation-profile';
import { resolveProductionRuntimeConfiguration, type ProductionRuntimeEnvironment } from './production-runtime-config';
import type { ProductionAuthorityEnvironment } from './production-authority-config';
import { resolveSchedulerTransportToken, type SchedulerTransportEnvironment } from './scheduler-transport';
import { parseEnvironmentSourceRegistry, type SourceRegistryEnvironment } from '../discovery/environment-source-registry';

export interface ControlledActivationEnvironment extends ProductionRuntimeEnvironment, ProductionAuthorityEnvironment, SchedulerTransportEnvironment, SourceRegistryEnvironment {
  readonly ORBI_NEWS_ACTIVATION_PROFILE?: string;
}

export interface ControlledActivationPreflight {
  readonly profile: ControlledActivationProfile;
  readonly ready: boolean;
  readonly sourceCount: number;
  readonly rssSourceCount: number;
  readonly reasons: readonly string[];
}

const parseProfile = (raw: string | undefined): ControlledActivationProfile => {
  const normalized = raw?.trim() || ControlledActivationProfile.DISABLED;
  if (!Object.values(ControlledActivationProfile).includes(normalized as ControlledActivationProfile)) {
    throw new RangeError('ORBI_NEWS_ACTIVATION_PROFILE_INVALID');
  }
  return normalized as ControlledActivationProfile;
};

const countEligibleRss = (sources: readonly SourceRegistryEntry[]): number => sources.filter((source) =>
  source.status === SourceRegistryStatus.ACTIVE &&
  source.allowedOrigins.includes(NewsOrigin.RSS) &&
  source.feedUrl !== null,
).length;

/** Preflight has no side effects and never calls providers. */
export const runControlledActivationPreflight = (environment: ControlledActivationEnvironment): ControlledActivationPreflight => {
  const profile = parseProfile(environment.ORBI_NEWS_ACTIVATION_PROFILE);
  const runtime = resolveProductionRuntimeConfiguration(environment);
  const activation = assessControlledActivationProfile({ profile, runtime, authorityEnvironment: environment });
  const sources = parseEnvironmentSourceRegistry(environment);
  const rssSourceCount = countEligibleRss(sources);
  const reasons = [...activation.reasons];

  if (profile === ControlledActivationProfile.DISCOVERY_ONLY) {
    try { resolveSchedulerTransportToken(environment); } catch { reasons.push('DISCOVERY_ONLY_SCHEDULER_TOKEN_REQUIRED'); }
    if (sources.length === 0) reasons.push('DISCOVERY_ONLY_SOURCE_REGISTRY_REQUIRED');
    if (rssSourceCount === 0) reasons.push('DISCOVERY_ONLY_ACTIVE_RSS_SOURCE_REQUIRED');
    const org = runtime.organizationId;
    if (org && sources.some((source) => source.organizationId !== org)) reasons.push('DISCOVERY_ONLY_SOURCE_ORGANIZATION_MISMATCH');
  }

  return { profile, ready: activation.ready && reasons.length === 0, sourceCount: sources.length, rssSourceCount, reasons };
};
