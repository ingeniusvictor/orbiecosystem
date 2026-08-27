import { AutonomyLevel, SystemMode } from '../../domain/common/enums';
import type { OrganizationId } from '../../domain/common/types';

export interface ProductionRuntimeEnvironment {
  readonly NODE_ENV?: string;
  readonly ORBI_NEWS_RUNTIME_ENABLED?: string;
  readonly ORBI_NEWS_ORGANIZATION_ID?: string;
  readonly ORBI_NEWS_WORKER_ID?: string;
  readonly ORBI_NEWS_SYSTEM_MODE?: string;
  readonly ORBI_NEWS_AUTONOMY_LEVEL?: string;
  readonly ORBI_NEWS_LEASE_DURATION_SECONDS?: string;
  readonly ORBI_NEWS_MAX_ATTEMPTS?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_ENABLED?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_PROJECT_ID?: string;
  readonly ORBI_EDITORIAL_FIRESTORE_DATABASE_ID?: string;
  readonly ORBI_EDITORIAL_LOCAL_STORE_FILE?: string;
}

export interface ProductionRuntimeConfiguration {
  readonly enabled: boolean;
  readonly organizationId: OrganizationId | null;
  readonly workerId: string | null;
  readonly systemMode: SystemMode;
  readonly autonomyLevel: AutonomyLevel;
  readonly leaseDurationSeconds: number;
  readonly maxAttempts: number;
  readonly firestore: {
    readonly enabled: boolean;
    readonly projectId: string | null;
    readonly databaseId: string | null;
  };
}

export const ORBI_PRODUCTION_DEFAULT_SYSTEM_MODE = SystemMode.MAINTENANCE;
export const ORBI_PRODUCTION_DEFAULT_AUTONOMY_LEVEL = AutonomyLevel.LEVEL_0;
export const ORBI_PRODUCTION_DEFAULT_LEASE_DURATION_SECONDS = 300;
export const ORBI_PRODUCTION_DEFAULT_MAX_ATTEMPTS = 3;

const parseBoolean = (label: string, value: string | undefined): boolean => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  throw new RangeError(`${label}_INVALID`);
};

const required = (label: string, value: string | undefined): string => {
  const normalized = value?.trim();
  if (!normalized) throw new RangeError(`${label}_REQUIRED`);
  return normalized;
};

const parsePositiveInteger = (label: string, value: string | undefined, fallback: number): number => {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new RangeError(`${label}_INVALID`);
  return parsed;
};

const parseEnum = <T extends string>(
  label: string,
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T => {
  const normalized = value?.trim();
  if (!normalized) return fallback;
  if (!allowed.includes(normalized as T)) throw new RangeError(`${label}_INVALID`);
  return normalized as T;
};

/**
 * Parses the server-only bootstrap configuration for the autonomous runtime.
 * Missing operational authority is intentionally safe: MAINTENANCE + LEVEL_0.
 * This contract does not enable any automation toggle or capability by itself.
 */
export const resolveProductionRuntimeConfiguration = (
  environment: ProductionRuntimeEnvironment,
): ProductionRuntimeConfiguration => {
  const enabled = parseBoolean('ORBI_NEWS_RUNTIME_ENABLED', environment.ORBI_NEWS_RUNTIME_ENABLED);
  const firestoreEnabled = parseBoolean(
    'ORBI_EDITORIAL_FIRESTORE_ENABLED',
    environment.ORBI_EDITORIAL_FIRESTORE_ENABLED,
  );
  const systemMode = parseEnum(
    'ORBI_NEWS_SYSTEM_MODE',
    environment.ORBI_NEWS_SYSTEM_MODE,
    Object.values(SystemMode),
    ORBI_PRODUCTION_DEFAULT_SYSTEM_MODE,
  );
  const autonomyLevel = parseEnum(
    'ORBI_NEWS_AUTONOMY_LEVEL',
    environment.ORBI_NEWS_AUTONOMY_LEVEL,
    Object.values(AutonomyLevel),
    ORBI_PRODUCTION_DEFAULT_AUTONOMY_LEVEL,
  );
  const leaseDurationSeconds = parsePositiveInteger(
    'ORBI_NEWS_LEASE_DURATION_SECONDS',
    environment.ORBI_NEWS_LEASE_DURATION_SECONDS,
    ORBI_PRODUCTION_DEFAULT_LEASE_DURATION_SECONDS,
  );
  const maxAttempts = parsePositiveInteger(
    'ORBI_NEWS_MAX_ATTEMPTS',
    environment.ORBI_NEWS_MAX_ATTEMPTS,
    ORBI_PRODUCTION_DEFAULT_MAX_ATTEMPTS,
  );

  const firestoreProjectId = environment.ORBI_EDITORIAL_FIRESTORE_PROJECT_ID?.trim() || null;
  const firestoreDatabaseId = environment.ORBI_EDITORIAL_FIRESTORE_DATABASE_ID?.trim() || null;

  if (!enabled) {
    return {
      enabled: false,
      organizationId: null,
      workerId: null,
      systemMode,
      autonomyLevel,
      leaseDurationSeconds,
      maxAttempts,
      firestore: {
        enabled: firestoreEnabled,
        projectId: firestoreProjectId,
        databaseId: firestoreDatabaseId,
      },
    };
  }

  const organizationId = required('ORBI_NEWS_ORGANIZATION_ID', environment.ORBI_NEWS_ORGANIZATION_ID) as OrganizationId;
  const workerId = required('ORBI_NEWS_WORKER_ID', environment.ORBI_NEWS_WORKER_ID);

  if (environment.NODE_ENV === 'production') {
    if (environment.ORBI_EDITORIAL_LOCAL_STORE_FILE?.trim()) {
      throw new RangeError('ORBI_NEWS_LOCAL_STORE_FORBIDDEN_IN_PRODUCTION');
    }
    if (!firestoreEnabled) {
      throw new RangeError('ORBI_NEWS_FIRESTORE_REQUIRED_IN_PRODUCTION');
    }
    if (!firestoreProjectId) {
      throw new RangeError('ORBI_NEWS_FIRESTORE_PROJECT_ID_REQUIRED_IN_PRODUCTION');
    }
  }

  return {
    enabled: true,
    organizationId,
    workerId,
    systemMode,
    autonomyLevel,
    leaseDurationSeconds,
    maxAttempts,
    firestore: {
      enabled: firestoreEnabled,
      projectId: firestoreProjectId,
      databaseId: firestoreDatabaseId,
    },
  };
};
