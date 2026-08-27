import { CapabilityStatus, SystemCapability } from '../../domain/common/enums';
import {
  AutomationToggle,
  KillSwitchScope,
  OperationalAction,
  type OperationalAuthoritySnapshot,
} from '../../domain/operations/operational-authority';
import type { ProductionRuntimeConfiguration } from './production-runtime-config';

export interface ProductionAuthorityEnvironment {
  readonly ORBI_NEWS_ENABLED_TOGGLES?: string;
  readonly ORBI_NEWS_AVAILABLE_CAPABILITIES?: string;
  readonly ORBI_NEWS_ACTIVE_KILL_SWITCHES?: string;
  readonly ORBI_NEWS_WEB_DAILY_LIMIT?: string;
  readonly ORBI_NEWS_WEB_DAILY_USED?: string;
}

const parseEnumList = <T extends string>(
  label: string,
  raw: string | undefined,
  allowed: readonly T[],
): readonly T[] => {
  const value = raw?.trim();
  if (!value) return [];
  const parts = [...new Set(value.split(',').map((part) => part.trim()).filter(Boolean))];
  const resolved: T[] = [];
  for (const part of parts) {
    if (!allowed.includes(part as T)) throw new RangeError(`${label}_INVALID_${part}`);
    resolved.push(part as T);
  }
  return resolved;
};

const parseNonNegativeInteger = (label: string, raw: string | undefined, fallback: number): number => {
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) throw new RangeError(`${label}_INVALID`);
  return parsed;
};

/**
 * Builds the production NA-10.1 snapshot from explicit allow-lists.
 * Missing toggles are false and missing capabilities remain NOT_CONFIGURED.
 */
export const resolveProductionOperationalAuthoritySnapshot = ({
  runtime,
  environment,
}: {
  readonly runtime: ProductionRuntimeConfiguration;
  readonly environment: ProductionAuthorityEnvironment;
}): OperationalAuthoritySnapshot => {
  const enabledToggles = parseEnumList(
    'ORBI_NEWS_ENABLED_TOGGLES',
    environment.ORBI_NEWS_ENABLED_TOGGLES,
    Object.values(AutomationToggle),
  );
  const availableCapabilities = parseEnumList(
    'ORBI_NEWS_AVAILABLE_CAPABILITIES',
    environment.ORBI_NEWS_AVAILABLE_CAPABILITIES,
    Object.values(SystemCapability),
  );
  const activeKillSwitches = parseEnumList(
    'ORBI_NEWS_ACTIVE_KILL_SWITCHES',
    environment.ORBI_NEWS_ACTIVE_KILL_SWITCHES,
    Object.values(KillSwitchScope),
  );

  const toggles: Partial<Record<AutomationToggle, boolean>> = {};
  for (const toggle of enabledToggles) toggles[toggle] = true;

  const capabilities: Partial<Record<SystemCapability, CapabilityStatus>> = {};
  for (const capability of availableCapabilities) capabilities[capability] = CapabilityStatus.AVAILABLE;

  const webLimit = parseNonNegativeInteger('ORBI_NEWS_WEB_DAILY_LIMIT', environment.ORBI_NEWS_WEB_DAILY_LIMIT, 8);
  const webUsed = parseNonNegativeInteger('ORBI_NEWS_WEB_DAILY_USED', environment.ORBI_NEWS_WEB_DAILY_USED, 0);

  return {
    systemMode: runtime.systemMode,
    autonomyLevel: runtime.autonomyLevel,
    toggles,
    activeKillSwitches,
    capabilities,
    dailyBudgets: {
      [OperationalAction.PUBLISH_WEB]: { limit: webLimit, used: webUsed },
    },
    retryBudgets: {},
  };
};
