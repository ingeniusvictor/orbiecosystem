import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AutonomyLevel,
  CapabilityStatus,
  SystemCapability,
  SystemMode,
} from '../../domain/common/enums';
import {
  AutomationToggle,
  KillSwitchScope,
  OperationalAction,
  OperationalDecision,
  OperationalHealthStatus,
  assessHealthConstrainedOperationalAuthority,
  constrainAutonomyByHealth,
  type OperationalAuthoritySnapshot,
  type OperationalHealthAssessment,
} from '../../domain/operations';

const health = (
  status: OperationalHealthStatus,
  ceiling: AutonomyLevel | null,
): OperationalHealthAssessment => ({
  status,
  reasons: status === OperationalHealthStatus.HEALTHY ? [] : [`HEALTH_${status}`],
  failureStreak: 0,
  hoursSinceLastSuccess: 0,
  recommendedAutonomyCeiling: ceiling,
});

const snapshot = (level: AutonomyLevel): OperationalAuthoritySnapshot => ({
  systemMode: SystemMode.NORMAL,
  autonomyLevel: level,
  toggles: {
    [AutomationToggle.AUTO_DISCOVERY]: true,
    [AutomationToggle.AUTO_DRAFT]: true,
    [AutomationToggle.AUTO_PUBLISH_WEB]: true,
  },
  activeKillSwitches: [],
  capabilities: {
    [SystemCapability.NEWS_DISCOVERY]: CapabilityStatus.AVAILABLE,
    [SystemCapability.EDITORIAL_GENERATION]: CapabilityStatus.AVAILABLE,
    [SystemCapability.PUBLIC_NEWS_PORTAL]: CapabilityStatus.AVAILABLE,
  },
  dailyBudgets: {},
  retryBudgets: {},
});

test('degraded health caps configured LEVEL_5 at LEVEL_3', () => {
  const result = constrainAutonomyByHealth(
    AutonomyLevel.LEVEL_5,
    health(OperationalHealthStatus.DEGRADED, AutonomyLevel.LEVEL_3),
  );
  assert.equal(result.configuredAutonomyLevel, AutonomyLevel.LEVEL_5);
  assert.equal(result.effectiveAutonomyLevel, AutonomyLevel.LEVEL_3);
  assert.equal(result.constrainedByHealth, true);
});

test('critical health caps configured LEVEL_5 at LEVEL_1', () => {
  const result = constrainAutonomyByHealth(
    AutonomyLevel.LEVEL_5,
    health(OperationalHealthStatus.CRITICAL, AutonomyLevel.LEVEL_1),
  );
  assert.equal(result.effectiveAutonomyLevel, AutonomyLevel.LEVEL_1);
  assert.equal(result.constrainedByHealth, true);
});

test('health ceiling can never increase a lower configured autonomy level', () => {
  const result = constrainAutonomyByHealth(
    AutonomyLevel.LEVEL_1,
    health(OperationalHealthStatus.DEGRADED, AutonomyLevel.LEVEL_3),
  );
  assert.equal(result.effectiveAutonomyLevel, AutonomyLevel.LEVEL_1);
  assert.equal(result.constrainedByHealth, false);
});

test('healthy assessment preserves configured autonomy exactly', () => {
  const result = constrainAutonomyByHealth(
    AutonomyLevel.LEVEL_2,
    health(OperationalHealthStatus.HEALTHY, null),
  );
  assert.equal(result.effectiveAutonomyLevel, AutonomyLevel.LEVEL_2);
  assert.equal(result.healthAutonomyCeiling, null);
  assert.equal(result.constrainedByHealth, false);
});

test('degraded health prevents autonomous web publication that otherwise meets NA-10.1', () => {
  const result = assessHealthConstrainedOperationalAuthority({
    action: OperationalAction.PUBLISH_WEB,
    snapshot: snapshot(AutonomyLevel.LEVEL_5),
    health: health(OperationalHealthStatus.DEGRADED, AutonomyLevel.LEVEL_3),
  });
  assert.equal(result.autonomy.effectiveAutonomyLevel, AutonomyLevel.LEVEL_3);
  assert.equal(result.authority.decision, OperationalDecision.DEFER);
  assert.ok(result.authority.reasons.includes('AUTONOMY_LEVEL_BELOW_LEVEL_5'));
});

test('critical health still allows discovery at LEVEL_1 when every other authority requirement is satisfied', () => {
  const result = assessHealthConstrainedOperationalAuthority({
    action: OperationalAction.DISCOVER_NEWS,
    snapshot: snapshot(AutonomyLevel.LEVEL_5),
    health: health(OperationalHealthStatus.CRITICAL, AutonomyLevel.LEVEL_1),
  });
  assert.equal(result.autonomy.effectiveAutonomyLevel, AutonomyLevel.LEVEL_1);
  assert.equal(result.authority.decision, OperationalDecision.ALLOW);
});

test('healthy status never bypasses kill switches or other NA-10.1 authority', () => {
  const result = assessHealthConstrainedOperationalAuthority({
    action: OperationalAction.PUBLISH_WEB,
    snapshot: {
      ...snapshot(AutonomyLevel.LEVEL_5),
      activeKillSwitches: [KillSwitchScope.ALL_PUBLISHING],
    },
    health: health(OperationalHealthStatus.HEALTHY, null),
  });
  assert.equal(result.autonomy.effectiveAutonomyLevel, AutonomyLevel.LEVEL_5);
  assert.equal(result.authority.decision, OperationalDecision.BLOCK);
  assert.ok(result.authority.reasons.includes('KILL_SWITCH_ALL_PUBLISHING'));
});

test('health reasons are preserved as observability context but are not injected as publication authority reasons', () => {
  const degraded = health(OperationalHealthStatus.DEGRADED, AutonomyLevel.LEVEL_3);
  const result = assessHealthConstrainedOperationalAuthority({
    action: OperationalAction.GENERATE_DRAFT,
    snapshot: snapshot(AutonomyLevel.LEVEL_5),
    health: degraded,
  });
  assert.deepEqual(result.healthReasons, degraded.reasons);
  assert.equal(result.authority.decision, OperationalDecision.ALLOW);
  assert.deepEqual(result.authority.reasons, []);
});
