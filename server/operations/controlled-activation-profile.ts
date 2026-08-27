import { AutonomyLevel, SystemCapability, SystemMode } from '../../domain/common/enums';
import { AutomationToggle, OperationalAction } from '../../domain/operations/operational-authority';
import type { ProductionRuntimeConfiguration } from './production-runtime-config';
import type { ProductionAuthorityEnvironment } from './production-authority-config';

export enum ControlledActivationProfile {
  DISABLED = 'DISABLED',
  DISCOVERY_ONLY = 'DISCOVERY_ONLY',
}

export interface ControlledActivationAssessment {
  readonly profile: ControlledActivationProfile;
  readonly ready: boolean;
  readonly reasons: readonly string[];
}

export const ORBI_CONTROLLED_ACTIVATION_ACTIONS: Readonly<Record<ControlledActivationProfile, readonly OperationalAction[]>> = {
  [ControlledActivationProfile.DISABLED]: [],
  [ControlledActivationProfile.DISCOVERY_ONLY]: [OperationalAction.DISCOVER_NEWS],
};

const csv = (value: string | undefined): readonly string[] =>
  value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];

/**
 * Enforces the first production activation profile. Discovery-only deliberately
 * forbids higher autonomy, publishing/social toggles and unrelated capabilities.
 */
export const assessControlledActivationProfile = ({
  profile,
  runtime,
  authorityEnvironment,
}: {
  readonly profile: ControlledActivationProfile;
  readonly runtime: ProductionRuntimeConfiguration;
  readonly authorityEnvironment: ProductionAuthorityEnvironment;
}): ControlledActivationAssessment => {
  if (profile === ControlledActivationProfile.DISABLED) {
    return { profile, ready: !runtime.enabled, reasons: runtime.enabled ? ['ACTIVATION_PROFILE_DISABLED_RUNTIME_ENABLED'] : [] };
  }

  const reasons: string[] = [];
  if (!runtime.enabled) reasons.push('DISCOVERY_ONLY_RUNTIME_DISABLED');
  if (runtime.systemMode !== SystemMode.NORMAL) reasons.push('DISCOVERY_ONLY_SYSTEM_MODE_MUST_BE_NORMAL');
  if (runtime.autonomyLevel !== AutonomyLevel.LEVEL_1) reasons.push('DISCOVERY_ONLY_AUTONOMY_MUST_EQUAL_LEVEL_1');
  if (!runtime.firestore.enabled) reasons.push('DISCOVERY_ONLY_FIRESTORE_REQUIRED');

  const toggles = csv(authorityEnvironment.ORBI_NEWS_ENABLED_TOGGLES);
  if (!toggles.includes(AutomationToggle.AUTO_DISCOVERY)) reasons.push('DISCOVERY_ONLY_AUTO_DISCOVERY_REQUIRED');
  for (const toggle of toggles) {
    if (toggle !== AutomationToggle.AUTO_DISCOVERY) reasons.push(`DISCOVERY_ONLY_FORBIDS_TOGGLE_${toggle}`);
  }

  const capabilities = csv(authorityEnvironment.ORBI_NEWS_AVAILABLE_CAPABILITIES);
  if (!capabilities.includes(SystemCapability.NEWS_DISCOVERY)) reasons.push('DISCOVERY_ONLY_NEWS_DISCOVERY_CAPABILITY_REQUIRED');
  for (const capability of capabilities) {
    if (capability !== SystemCapability.NEWS_DISCOVERY) reasons.push(`DISCOVERY_ONLY_FORBIDS_CAPABILITY_${capability}`);
  }

  return { profile, ready: reasons.length === 0, reasons };
};
