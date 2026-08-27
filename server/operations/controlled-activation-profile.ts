import { AutonomyLevel, SystemCapability, SystemMode } from '../../domain/common/enums';
import { AutomationToggle, OperationalAction } from '../../domain/operations/operational-authority';
import type { ProductionRuntimeConfiguration } from './production-runtime-config';
import type { ProductionAuthorityEnvironment } from './production-authority-config';

export enum ControlledActivationProfile {
  DISABLED = 'DISABLED',
  DISCOVERY_ONLY = 'DISCOVERY_ONLY',
  EDITORIAL_ASSISTED = 'EDITORIAL_ASSISTED',
  WEB_AUTONOMOUS = 'WEB_AUTONOMOUS',
}

export interface ControlledActivationAssessment {
  readonly profile: ControlledActivationProfile;
  readonly ready: boolean;
  readonly reasons: readonly string[];
}

export const ORBI_CONTROLLED_ACTIVATION_ACTIONS: Readonly<Record<ControlledActivationProfile, readonly OperationalAction[]>> = {
  [ControlledActivationProfile.DISABLED]: [],
  [ControlledActivationProfile.DISCOVERY_ONLY]: [OperationalAction.DISCOVER_NEWS],
  [ControlledActivationProfile.EDITORIAL_ASSISTED]: [
    OperationalAction.DISCOVER_NEWS,
    OperationalAction.VERIFY_NEWS,
    OperationalAction.GENERATE_DRAFT,
  ],
  [ControlledActivationProfile.WEB_AUTONOMOUS]: [
    OperationalAction.DISCOVER_NEWS,
    OperationalAction.VERIFY_NEWS,
    OperationalAction.GENERATE_DRAFT,
    OperationalAction.PUBLISH_WEB,
  ],
};

const csv = (value: string | undefined): readonly string[] =>
  value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];

const assessExactProfile = ({
  prefix,
  runtime,
  authorityEnvironment,
  autonomyLevel,
  requiredToggles,
  requiredCapabilities,
}: {
  readonly prefix: string;
  readonly runtime: ProductionRuntimeConfiguration;
  readonly authorityEnvironment: ProductionAuthorityEnvironment;
  readonly autonomyLevel: AutonomyLevel;
  readonly requiredToggles: readonly AutomationToggle[];
  readonly requiredCapabilities: readonly SystemCapability[];
}): readonly string[] => {
  const reasons: string[] = [];
  if (!runtime.enabled) reasons.push(`${prefix}_RUNTIME_DISABLED`);
  if (runtime.systemMode !== SystemMode.NORMAL) reasons.push(`${prefix}_SYSTEM_MODE_MUST_BE_NORMAL`);
  if (runtime.autonomyLevel !== autonomyLevel) reasons.push(`${prefix}_AUTONOMY_MUST_EQUAL_${autonomyLevel}`);
  if (!runtime.firestore.enabled) reasons.push(`${prefix}_FIRESTORE_REQUIRED`);

  const toggles = csv(authorityEnvironment.ORBI_NEWS_ENABLED_TOGGLES);
  for (const required of requiredToggles) {
    if (!toggles.includes(required)) reasons.push(`${prefix}_${required}_REQUIRED`);
  }
  for (const toggle of toggles) {
    if (!requiredToggles.includes(toggle as AutomationToggle)) reasons.push(`${prefix}_FORBIDS_TOGGLE_${toggle}`);
  }

  const capabilities = csv(authorityEnvironment.ORBI_NEWS_AVAILABLE_CAPABILITIES);
  for (const required of requiredCapabilities) {
    if (!capabilities.includes(required)) reasons.push(`${prefix}_${required}_CAPABILITY_REQUIRED`);
  }
  for (const capability of capabilities) {
    if (!requiredCapabilities.includes(capability as SystemCapability)) reasons.push(`${prefix}_FORBIDS_CAPABILITY_${capability}`);
  }
  return reasons;
};

const commonEditorialToggles = [
  AutomationToggle.AUTO_DISCOVERY,
  AutomationToggle.AUTO_VERIFICATION,
  AutomationToggle.AUTO_DRAFT,
] as const;
const commonEditorialCapabilities = [
  SystemCapability.NEWS_DISCOVERY,
  SystemCapability.WEB_RESEARCH,
  SystemCapability.VERIFICATION,
  SystemCapability.EVENT_INTELLIGENCE,
  SystemCapability.SCORING,
  SystemCapability.EDITORIAL_GENERATION,
] as const;

/**
 * Controlled activation is exact allow-list configuration, not a minimum.
 * WEB_AUTONOMOUS is operator authorization for deterministic low-risk web
 * publication only; email/social/image automation remain separate and forbidden.
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

  let reasons: readonly string[];
  if (profile === ControlledActivationProfile.DISCOVERY_ONLY) {
    reasons = assessExactProfile({
      prefix: 'DISCOVERY_ONLY', runtime, authorityEnvironment,
      autonomyLevel: AutonomyLevel.LEVEL_1,
      requiredToggles: [AutomationToggle.AUTO_DISCOVERY],
      requiredCapabilities: [SystemCapability.NEWS_DISCOVERY],
    });
  } else if (profile === ControlledActivationProfile.EDITORIAL_ASSISTED) {
    reasons = assessExactProfile({
      prefix: 'EDITORIAL_ASSISTED', runtime, authorityEnvironment,
      autonomyLevel: AutonomyLevel.LEVEL_3,
      requiredToggles: commonEditorialToggles,
      requiredCapabilities: commonEditorialCapabilities,
    });
  } else {
    reasons = assessExactProfile({
      prefix: 'WEB_AUTONOMOUS', runtime, authorityEnvironment,
      autonomyLevel: AutonomyLevel.LEVEL_5,
      requiredToggles: [...commonEditorialToggles, AutomationToggle.AUTO_PUBLISH_WEB],
      requiredCapabilities: [...commonEditorialCapabilities, SystemCapability.PUBLIC_NEWS_PORTAL],
    });
  }

  return { profile, ready: reasons.length === 0, reasons };
};
