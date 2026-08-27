import test from 'node:test';
import assert from 'node:assert/strict';

import { OperationalAction } from '../../domain/operations';
import { resolveProductionOperationalAuthoritySnapshot } from '../../server/operations/production-authority-config';
import { createProductionOperationHandler, listConfiguredProductionActions } from '../../server/operations/production-handler-registry';
import { assessProductionRuntimeReadiness, ProductionRuntimeReadinessStatus } from '../../server/operations/production-readiness';
import { resolveProductionRuntimeConfiguration } from '../../server/operations/production-runtime-config';
import { authenticateSchedulerToken, resolveSchedulerTransportToken } from '../../server/operations/scheduler-transport';

const TOKEN = '0123456789abcdef0123456789abcdef';

const productionEnvironment = () => ({
  NODE_ENV: 'production',
  ORBI_NEWS_RUNTIME_ENABLED: 'true',
  ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
  ORBI_NEWS_WORKER_ID: 'worker-a',
  ORBI_NEWS_SYSTEM_MODE: 'NORMAL',
  ORBI_NEWS_AUTONOMY_LEVEL: 'LEVEL_1',
  ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
  ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
  ORBI_NEWS_SCHEDULER_TOKEN: TOKEN,
});

test('FULL GATE: production runtime is disabled and non-authoritative by default', () => {
  const runtime = resolveProductionRuntimeConfiguration({});
  const authority = resolveProductionOperationalAuthoritySnapshot({ runtime, environment: {} });
  const readiness = assessProductionRuntimeReadiness({ runtime, authoritySnapshot: authority, configuredActions: [] });
  assert.equal(runtime.enabled, false);
  assert.equal(readiness.status, ProductionRuntimeReadinessStatus.DISABLED);
});

test('FULL GATE: enabling production runtime without durable Firestore fails closed', () => {
  assert.throws(() => resolveProductionRuntimeConfiguration({
    NODE_ENV: 'production',
    ORBI_NEWS_RUNTIME_ENABLED: 'true',
    ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
    ORBI_NEWS_WORKER_ID: 'worker-a',
  }), /ORBI_NEWS_FIRESTORE_REQUIRED_IN_PRODUCTION/);
});

test('FULL GATE: handler alone is SAFE_IDLE until matching toggle and capability are explicit', () => {
  const runtime = resolveProductionRuntimeConfiguration(productionEnvironment());
  const registry = { [OperationalAction.DISCOVER_NEWS]: async () => undefined };
  const authority = resolveProductionOperationalAuthoritySnapshot({ runtime, environment: productionEnvironment() });
  const readiness = assessProductionRuntimeReadiness({
    runtime,
    authoritySnapshot: authority,
    configuredActions: listConfiguredProductionActions(registry),
  });
  assert.equal(readiness.status, ProductionRuntimeReadinessStatus.SAFE_IDLE);
  assert.deepEqual(readiness.allowedActions, []);
});

test('FULL GATE: explicit discovery handler + toggle + capability reaches READY only for discovery', () => {
  const environment = {
    ...productionEnvironment(),
    ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY',
    ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY',
  };
  const runtime = resolveProductionRuntimeConfiguration(environment);
  const registry = { [OperationalAction.DISCOVER_NEWS]: async () => undefined };
  const authority = resolveProductionOperationalAuthoritySnapshot({ runtime, environment });
  const readiness = assessProductionRuntimeReadiness({
    runtime,
    authoritySnapshot: authority,
    configuredActions: listConfiguredProductionActions(registry),
  });
  assert.equal(readiness.status, ProductionRuntimeReadinessStatus.READY);
  assert.deepEqual(readiness.allowedActions, [OperationalAction.DISCOVER_NEWS]);
});

test('FULL GATE: kill switch degrades readiness even when handler/toggle/capability are configured', () => {
  const environment = {
    ...productionEnvironment(),
    ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY',
    ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY',
    ORBI_NEWS_ACTIVE_KILL_SWITCHES: 'NEWS_DISCOVERY',
  };
  const runtime = resolveProductionRuntimeConfiguration(environment);
  const registry = { [OperationalAction.DISCOVER_NEWS]: async () => undefined };
  const authority = resolveProductionOperationalAuthoritySnapshot({ runtime, environment });
  const readiness = assessProductionRuntimeReadiness({ runtime, authoritySnapshot: authority, configuredActions: listConfiguredProductionActions(registry) });
  assert.equal(readiness.status, ProductionRuntimeReadinessStatus.DEGRADED);
  assert.deepEqual(readiness.blockedActions, [OperationalAction.DISCOVER_NEWS]);
});

test('FULL GATE: unregistered action never simulates production success', async () => {
  const handler = createProductionOperationHandler({});
  await assert.rejects(() => handler({
    organizationId: 'orbi-ecosystem' as any,
    workerId: 'worker-a',
    job: 'DISCOVERY_RADAR' as any,
    action: OperationalAction.DISCOVER_NEWS,
    tickKey: 'DISCOVERY_RADAR:2026-08-27:09',
    nowUtc: '2026-08-27T13:00:00.000Z' as any,
  }), /OPERATION_HANDLER_DISCOVER_NEWS_NOT_CONFIGURED/);
});

test('FULL GATE: scheduler transport secret is mandatory and wrong tokens cannot authenticate', () => {
  const token = resolveSchedulerTransportToken(productionEnvironment());
  assert.equal(token, TOKEN);
  assert.equal(authenticateSchedulerToken(token, 'wrong'), false);
  assert.equal(authenticateSchedulerToken(token, token), true);
});
