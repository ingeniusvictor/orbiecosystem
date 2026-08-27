import test from 'node:test';
import assert from 'node:assert/strict';

import { AutonomyLevel, SystemMode } from '../../domain/common/enums';
import {
  ORBI_PRODUCTION_DEFAULT_AUTONOMY_LEVEL,
  ORBI_PRODUCTION_DEFAULT_LEASE_DURATION_SECONDS,
  ORBI_PRODUCTION_DEFAULT_MAX_ATTEMPTS,
  ORBI_PRODUCTION_DEFAULT_SYSTEM_MODE,
  resolveProductionRuntimeConfiguration,
} from '../../server/operations/production-runtime-config';

test('runtime is disabled by default and safe defaults are explicit', () => {
  const config = resolveProductionRuntimeConfiguration({});
  assert.equal(config.enabled, false);
  assert.equal(config.organizationId, null);
  assert.equal(config.workerId, null);
  assert.equal(config.systemMode, SystemMode.MAINTENANCE);
  assert.equal(config.autonomyLevel, AutonomyLevel.LEVEL_0);
  assert.equal(config.leaseDurationSeconds, 300);
  assert.equal(config.maxAttempts, 3);
  assert.equal(ORBI_PRODUCTION_DEFAULT_SYSTEM_MODE, SystemMode.MAINTENANCE);
  assert.equal(ORBI_PRODUCTION_DEFAULT_AUTONOMY_LEVEL, AutonomyLevel.LEVEL_0);
  assert.equal(ORBI_PRODUCTION_DEFAULT_LEASE_DURATION_SECONDS, 300);
  assert.equal(ORBI_PRODUCTION_DEFAULT_MAX_ATTEMPTS, 3);
});

test('enabled non-production runtime requires organization and worker identity', () => {
  assert.throws(
    () => resolveProductionRuntimeConfiguration({ ORBI_NEWS_RUNTIME_ENABLED: 'true' }),
    /ORBI_NEWS_ORGANIZATION_ID_REQUIRED/,
  );
  assert.throws(
    () => resolveProductionRuntimeConfiguration({
      ORBI_NEWS_RUNTIME_ENABLED: 'true',
      ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
    }),
    /ORBI_NEWS_WORKER_ID_REQUIRED/,
  );
});

test('production runtime requires durable Firestore and project id', () => {
  const base = {
    NODE_ENV: 'production',
    ORBI_NEWS_RUNTIME_ENABLED: 'true',
    ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
    ORBI_NEWS_WORKER_ID: 'cloud-run-worker',
  } as const;

  assert.throws(
    () => resolveProductionRuntimeConfiguration(base),
    /ORBI_NEWS_FIRESTORE_REQUIRED_IN_PRODUCTION/,
  );
  assert.throws(
    () => resolveProductionRuntimeConfiguration({
      ...base,
      ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
    }),
    /ORBI_NEWS_FIRESTORE_PROJECT_ID_REQUIRED_IN_PRODUCTION/,
  );
});

test('production runtime forbids local editorial store', () => {
  assert.throws(
    () => resolveProductionRuntimeConfiguration({
      NODE_ENV: 'production',
      ORBI_NEWS_RUNTIME_ENABLED: 'true',
      ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
      ORBI_NEWS_WORKER_ID: 'cloud-run-worker',
      ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
      ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
      ORBI_EDITORIAL_LOCAL_STORE_FILE: './private/editorial.json',
    }),
    /ORBI_NEWS_LOCAL_STORE_FORBIDDEN_IN_PRODUCTION/,
  );
});

test('explicit production authority bootstrap values parse without enabling capabilities or toggles', () => {
  const config = resolveProductionRuntimeConfiguration({
    NODE_ENV: 'production',
    ORBI_NEWS_RUNTIME_ENABLED: '1',
    ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
    ORBI_NEWS_WORKER_ID: 'cloud-run-worker-1',
    ORBI_NEWS_SYSTEM_MODE: SystemMode.NORMAL,
    ORBI_NEWS_AUTONOMY_LEVEL: AutonomyLevel.LEVEL_2,
    ORBI_NEWS_LEASE_DURATION_SECONDS: '180',
    ORBI_NEWS_MAX_ATTEMPTS: '2',
    ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
    ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
    ORBI_EDITORIAL_FIRESTORE_DATABASE_ID: 'orbi-news',
  });

  assert.equal(config.enabled, true);
  assert.equal(config.organizationId, 'orbi-ecosystem');
  assert.equal(config.workerId, 'cloud-run-worker-1');
  assert.equal(config.systemMode, SystemMode.NORMAL);
  assert.equal(config.autonomyLevel, AutonomyLevel.LEVEL_2);
  assert.equal(config.leaseDurationSeconds, 180);
  assert.equal(config.maxAttempts, 2);
  assert.deepEqual(config.firestore, {
    enabled: true,
    projectId: 'orbi-prod',
    databaseId: 'orbi-news',
  });
});

test('invalid flags, enums and positive integers fail closed', () => {
  assert.throws(
    () => resolveProductionRuntimeConfiguration({ ORBI_NEWS_RUNTIME_ENABLED: 'yes' }),
    /ORBI_NEWS_RUNTIME_ENABLED_INVALID/,
  );
  assert.throws(
    () => resolveProductionRuntimeConfiguration({ ORBI_NEWS_SYSTEM_MODE: 'SUPER_NORMAL' }),
    /ORBI_NEWS_SYSTEM_MODE_INVALID/,
  );
  assert.throws(
    () => resolveProductionRuntimeConfiguration({ ORBI_NEWS_AUTONOMY_LEVEL: 'LEVEL_99' }),
    /ORBI_NEWS_AUTONOMY_LEVEL_INVALID/,
  );
  assert.throws(
    () => resolveProductionRuntimeConfiguration({ ORBI_NEWS_LEASE_DURATION_SECONDS: '0' }),
    /ORBI_NEWS_LEASE_DURATION_SECONDS_INVALID/,
  );
  assert.throws(
    () => resolveProductionRuntimeConfiguration({ ORBI_NEWS_MAX_ATTEMPTS: '1.5' }),
    /ORBI_NEWS_MAX_ATTEMPTS_INVALID/,
  );
});
