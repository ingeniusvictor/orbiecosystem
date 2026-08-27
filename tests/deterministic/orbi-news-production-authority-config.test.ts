import test from 'node:test';
import assert from 'node:assert/strict';

import { AutonomyLevel, CapabilityStatus, SystemCapability, SystemMode } from '../../domain/common/enums';
import { AutomationToggle, KillSwitchScope, OperationalAction } from '../../domain/operations';
import { resolveProductionOperationalAuthoritySnapshot } from '../../server/operations/production-authority-config';
import type { ProductionRuntimeConfiguration } from '../../server/operations/production-runtime-config';

const runtime: ProductionRuntimeConfiguration = {
  enabled: true,
  organizationId: 'orbi-ecosystem' as ProductionRuntimeConfiguration['organizationId'],
  workerId: 'worker-a',
  systemMode: SystemMode.NORMAL,
  autonomyLevel: AutonomyLevel.LEVEL_3,
  leaseDurationSeconds: 300,
  maxAttempts: 3,
  firestore: { enabled: true, projectId: 'orbi-prod', databaseId: null },
};

test('missing authority lists fail closed with no toggles or capabilities enabled', () => {
  const snapshot = resolveProductionOperationalAuthoritySnapshot({ runtime, environment: {} });
  assert.deepEqual(snapshot.toggles, {});
  assert.deepEqual(snapshot.capabilities, {});
  assert.deepEqual(snapshot.activeKillSwitches, []);
  assert.equal(snapshot.dailyBudgets[OperationalAction.PUBLISH_WEB]?.limit, 8);
  assert.equal(snapshot.dailyBudgets[OperationalAction.PUBLISH_WEB]?.used, 0);
});

test('explicit allow-lists enable only named toggles and capabilities', () => {
  const snapshot = resolveProductionOperationalAuthoritySnapshot({
    runtime,
    environment: {
      ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY,AUTO_VERIFICATION',
      ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY,VERIFICATION',
      ORBI_NEWS_ACTIVE_KILL_SWITCHES: 'EMAIL_DELIVERY',
    },
  });
  assert.equal(snapshot.toggles[AutomationToggle.AUTO_DISCOVERY], true);
  assert.equal(snapshot.toggles[AutomationToggle.AUTO_VERIFICATION], true);
  assert.equal(snapshot.toggles[AutomationToggle.AUTO_PUBLISH_WEB], undefined);
  assert.equal(snapshot.capabilities[SystemCapability.NEWS_DISCOVERY], CapabilityStatus.AVAILABLE);
  assert.equal(snapshot.capabilities[SystemCapability.VERIFICATION], CapabilityStatus.AVAILABLE);
  assert.equal(snapshot.capabilities[SystemCapability.PUBLIC_NEWS_PORTAL], undefined);
  assert.deepEqual(snapshot.activeKillSwitches, [KillSwitchScope.EMAIL_DELIVERY]);
});

test('unknown enum entries fail closed instead of being ignored', () => {
  assert.throws(() => resolveProductionOperationalAuthoritySnapshot({
    runtime,
    environment: { ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY,AUTO_MAGIC' },
  }), /ORBI_NEWS_ENABLED_TOGGLES_INVALID_AUTO_MAGIC/);
  assert.throws(() => resolveProductionOperationalAuthoritySnapshot({
    runtime,
    environment: { ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY,TELEPORT' },
  }), /ORBI_NEWS_AVAILABLE_CAPABILITIES_INVALID_TELEPORT/);
});

test('web publication budget remains explicit and validates nonnegative integers', () => {
  const snapshot = resolveProductionOperationalAuthoritySnapshot({
    runtime,
    environment: { ORBI_NEWS_WEB_DAILY_LIMIT: '8', ORBI_NEWS_WEB_DAILY_USED: '7' },
  });
  assert.deepEqual(snapshot.dailyBudgets[OperationalAction.PUBLISH_WEB], { limit: 8, used: 7 });
  assert.throws(() => resolveProductionOperationalAuthoritySnapshot({
    runtime,
    environment: { ORBI_NEWS_WEB_DAILY_USED: '-1' },
  }), /ORBI_NEWS_WEB_DAILY_USED_INVALID/);
});
