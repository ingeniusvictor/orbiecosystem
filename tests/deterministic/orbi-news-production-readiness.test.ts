import test from 'node:test';
import assert from 'node:assert/strict';
import { AutonomyLevel, CapabilityStatus, SystemCapability, SystemMode } from '../../domain/common/enums';
import { AutomationToggle, KillSwitchScope, OperationalAction } from '../../domain/operations';
import { assessProductionRuntimeReadiness, ProductionRuntimeReadinessStatus } from '../../server/operations/production-readiness';
import type { ProductionRuntimeConfiguration } from '../../server/operations/production-runtime-config';

const runtime = (enabled = true): ProductionRuntimeConfiguration => ({
  enabled,
  organizationId: enabled ? 'orbi-ecosystem' as ProductionRuntimeConfiguration['organizationId'] : null,
  workerId: enabled ? 'worker-a' : null,
  systemMode: SystemMode.NORMAL,
  autonomyLevel: AutonomyLevel.LEVEL_1,
  leaseDurationSeconds: 300,
  maxAttempts: 3,
  firestore: { enabled, projectId: enabled ? 'orbi-prod' : null, databaseId: null },
});

const authority = () => ({
  systemMode: SystemMode.NORMAL,
  autonomyLevel: AutonomyLevel.LEVEL_1,
  toggles: { [AutomationToggle.AUTO_DISCOVERY]: true },
  activeKillSwitches: [],
  capabilities: { [SystemCapability.NEWS_DISCOVERY]: CapabilityStatus.AVAILABLE },
  dailyBudgets: {},
  retryBudgets: {},
});

test('disabled runtime reports DISABLED independently of handlers', () => {
  const result = assessProductionRuntimeReadiness({ runtime: runtime(false), authoritySnapshot: authority(), configuredActions: [OperationalAction.DISCOVER_NEWS] });
  assert.equal(result.status, ProductionRuntimeReadinessStatus.DISABLED);
});

test('enabled runtime with no production handlers is SAFE_IDLE', () => {
  const result = assessProductionRuntimeReadiness({ runtime: runtime(), authoritySnapshot: authority(), configuredActions: [] });
  assert.equal(result.status, ProductionRuntimeReadinessStatus.SAFE_IDLE);
});

test('configured and operationally allowed action reports READY', () => {
  const result = assessProductionRuntimeReadiness({ runtime: runtime(), authoritySnapshot: authority(), configuredActions: [OperationalAction.DISCOVER_NEWS] });
  assert.equal(result.status, ProductionRuntimeReadinessStatus.READY);
  assert.deepEqual(result.allowedActions, [OperationalAction.DISCOVER_NEWS]);
});

test('mixed allowed and deferred configured actions reports PARTIAL', () => {
  const result = assessProductionRuntimeReadiness({
    runtime: runtime(),
    authoritySnapshot: authority(),
    configuredActions: [OperationalAction.DISCOVER_NEWS, OperationalAction.PREPARE_SOCIAL],
  });
  assert.equal(result.status, ProductionRuntimeReadinessStatus.PARTIAL);
  assert.deepEqual(result.deferredActions, [OperationalAction.PREPARE_SOCIAL]);
});

test('kill-switch-blocked configured action reports DEGRADED', () => {
  const snapshot = { ...authority(), activeKillSwitches: [KillSwitchScope.NEWS_DISCOVERY] };
  const result = assessProductionRuntimeReadiness({ runtime: runtime(), authoritySnapshot: snapshot, configuredActions: [OperationalAction.DISCOVER_NEWS] });
  assert.equal(result.status, ProductionRuntimeReadinessStatus.DEGRADED);
  assert.deepEqual(result.blockedActions, [OperationalAction.DISCOVER_NEWS]);
});
