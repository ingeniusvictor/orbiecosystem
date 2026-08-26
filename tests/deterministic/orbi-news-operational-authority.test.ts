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
  assessOperationalAuthority,
  type OperationalAuthoritySnapshot,
} from '../../domain/operations';

const enabledSnapshot = (): OperationalAuthoritySnapshot => ({
  systemMode: SystemMode.NORMAL,
  autonomyLevel: AutonomyLevel.LEVEL_5,
  toggles: {
    [AutomationToggle.AUTO_DISCOVERY]: true,
    [AutomationToggle.AUTO_VERIFICATION]: true,
    [AutomationToggle.AUTO_DRAFT]: true,
    [AutomationToggle.AUTO_IMAGE]: true,
    [AutomationToggle.AUTO_SCHEDULE]: true,
    [AutomationToggle.AUTO_PUBLISH_WEB]: true,
    [AutomationToggle.AUTO_PREPARE_SOCIAL]: true,
    [AutomationToggle.AUTO_EMAIL]: true,
    [AutomationToggle.AUTO_PUBLISH_FACEBOOK]: true,
    [AutomationToggle.AUTO_PUBLISH_INSTAGRAM]: true,
  },
  activeKillSwitches: [],
  capabilities: {
    [SystemCapability.NEWS_DISCOVERY]: CapabilityStatus.AVAILABLE,
    [SystemCapability.VERIFICATION]: CapabilityStatus.AVAILABLE,
    [SystemCapability.EDITORIAL_GENERATION]: CapabilityStatus.AVAILABLE,
    [SystemCapability.IMAGE_GENERATION]: CapabilityStatus.AVAILABLE,
    [SystemCapability.SCHEDULER]: CapabilityStatus.AVAILABLE,
    [SystemCapability.PUBLIC_NEWS_PORTAL]: CapabilityStatus.AVAILABLE,
    [SystemCapability.EMAIL_DELIVERY]: CapabilityStatus.AVAILABLE,
    [SystemCapability.FACEBOOK_PUBLISHING]: CapabilityStatus.AVAILABLE,
    [SystemCapability.INSTAGRAM_PUBLISHING]: CapabilityStatus.AVAILABLE,
  },
  dailyBudgets: {},
  retryBudgets: {},
});

test('fully enabled snapshot allows operational attempt', () => {
  const result = assessOperationalAuthority(OperationalAction.PUBLISH_WEB, enabledSnapshot());
  assert.equal(result.decision, OperationalDecision.ALLOW);
  assert.deepEqual(result.reasons, []);
});

test('EMERGENCY_STOP blocks every operation before lower-priority checks', () => {
  const snapshot = {
    ...enabledSnapshot(),
    systemMode: SystemMode.EMERGENCY_STOP,
    toggles: {},
    capabilities: {},
  };

  for (const action of Object.values(OperationalAction)) {
    const result = assessOperationalAuthority(action, snapshot);
    assert.equal(result.decision, OperationalDecision.BLOCK);
    assert.ok(result.reasons.includes('SYSTEM_MODE_EMERGENCY_STOP'));
  }
});

test('global and scoped kill switches block matching operations', () => {
  const globalResult = assessOperationalAuthority(OperationalAction.DISCOVER_NEWS, {
    ...enabledSnapshot(),
    activeKillSwitches: [KillSwitchScope.GLOBAL],
  });
  assert.equal(globalResult.decision, OperationalDecision.BLOCK);
  assert.ok(globalResult.reasons.includes('KILL_SWITCH_GLOBAL'));

  const facebookResult = assessOperationalAuthority(OperationalAction.PUBLISH_FACEBOOK, {
    ...enabledSnapshot(),
    activeKillSwitches: [KillSwitchScope.FACEBOOK],
  });
  assert.equal(facebookResult.decision, OperationalDecision.BLOCK);
  assert.ok(facebookResult.reasons.includes('KILL_SWITCH_FACEBOOK'));

  const instagramUnaffected = assessOperationalAuthority(OperationalAction.PUBLISH_INSTAGRAM, {
    ...enabledSnapshot(),
    activeKillSwitches: [KillSwitchScope.FACEBOOK],
  });
  assert.equal(instagramUnaffected.decision, OperationalDecision.ALLOW);
});

test('ALL_PUBLISHING blocks web and social publishing but not preparation', () => {
  const snapshot = {
    ...enabledSnapshot(),
    activeKillSwitches: [KillSwitchScope.ALL_PUBLISHING],
  };

  for (const action of [
    OperationalAction.SCHEDULE_WEB_PUBLICATION,
    OperationalAction.PUBLISH_WEB,
    OperationalAction.PUBLISH_FACEBOOK,
    OperationalAction.PUBLISH_INSTAGRAM,
  ]) {
    assert.equal(assessOperationalAuthority(action, snapshot).decision, OperationalDecision.BLOCK);
  }

  assert.equal(
    assessOperationalAuthority(OperationalAction.PREPARE_SOCIAL, snapshot).decision,
    OperationalDecision.ALLOW,
  );
});

test('READ_ONLY and MAINTENANCE defer mutations while discovery and verification may continue', () => {
  for (const mode of [SystemMode.READ_ONLY, SystemMode.MAINTENANCE]) {
    const snapshot = { ...enabledSnapshot(), systemMode: mode };

    assert.equal(
      assessOperationalAuthority(OperationalAction.GENERATE_DRAFT, snapshot).decision,
      OperationalDecision.DEFER,
    );
    assert.equal(
      assessOperationalAuthority(OperationalAction.PUBLISH_WEB, snapshot).decision,
      OperationalDecision.DEFER,
    );
    assert.equal(
      assessOperationalAuthority(OperationalAction.DISCOVER_NEWS, snapshot).decision,
      OperationalDecision.ALLOW,
    );
    assert.equal(
      assessOperationalAuthority(OperationalAction.VERIFY_NEWS, snapshot).decision,
      OperationalDecision.ALLOW,
    );
  }
});

test('LEVEL_5 alone never grants authority when toggle or capability is unavailable', () => {
  const noToggle = assessOperationalAuthority(OperationalAction.PUBLISH_WEB, {
    ...enabledSnapshot(),
    toggles: { ...enabledSnapshot().toggles, [AutomationToggle.AUTO_PUBLISH_WEB]: false },
  });
  assert.equal(noToggle.decision, OperationalDecision.DEFER);
  assert.ok(noToggle.reasons.includes('AUTOMATION_TOGGLE_AUTO_PUBLISH_WEB_DISABLED'));

  const noCapability = assessOperationalAuthority(OperationalAction.PUBLISH_WEB, {
    ...enabledSnapshot(),
    capabilities: { ...enabledSnapshot().capabilities, [SystemCapability.PUBLIC_NEWS_PORTAL]: CapabilityStatus.NOT_CONFIGURED },
  });
  assert.equal(noCapability.decision, OperationalDecision.DEFER);
  assert.ok(noCapability.reasons.includes('CAPABILITY_PUBLIC_NEWS_PORTAL_NOT_CONFIGURED'));
});

test('minimum autonomy levels are enforced per operation', () => {
  const publish = assessOperationalAuthority(OperationalAction.PUBLISH_WEB, {
    ...enabledSnapshot(),
    autonomyLevel: AutonomyLevel.LEVEL_4,
  });
  assert.equal(publish.decision, OperationalDecision.DEFER);
  assert.ok(publish.reasons.includes('AUTONOMY_LEVEL_BELOW_LEVEL_5'));

  const discovery = assessOperationalAuthority(OperationalAction.DISCOVER_NEWS, {
    ...enabledSnapshot(),
    autonomyLevel: AutonomyLevel.LEVEL_1,
  });
  assert.equal(discovery.decision, OperationalDecision.ALLOW);
});

test('missing capability fails closed as NOT_CONFIGURED', () => {
  const result = assessOperationalAuthority(OperationalAction.SEND_SOCIAL_EMAIL, {
    ...enabledSnapshot(),
    capabilities: {},
  });
  assert.equal(result.decision, OperationalDecision.DEFER);
  assert.ok(result.reasons.includes('CAPABILITY_EMAIL_DELIVERY_NOT_CONFIGURED'));
});

test('daily operation limit and retry budget defer execution when exhausted', () => {
  const daily = assessOperationalAuthority(OperationalAction.DISCOVER_NEWS, {
    ...enabledSnapshot(),
    dailyBudgets: {
      [OperationalAction.DISCOVER_NEWS]: { limit: 8, used: 8 },
    },
  });
  assert.equal(daily.decision, OperationalDecision.DEFER);
  assert.ok(daily.reasons.includes('DAILY_OPERATION_LIMIT_REACHED'));

  const retry = assessOperationalAuthority(OperationalAction.SEND_SOCIAL_EMAIL, {
    ...enabledSnapshot(),
    retryBudgets: {
      [OperationalAction.SEND_SOCIAL_EMAIL]: { maxAttempts: 3, attemptsUsed: 3 },
    },
  });
  assert.equal(retry.decision, OperationalDecision.DEFER);
  assert.ok(retry.reasons.includes('RETRY_BUDGET_EXHAUSTED'));
});

test('budgets reject invalid negative or fractional counters', () => {
  assert.throws(
    () => assessOperationalAuthority(OperationalAction.DISCOVER_NEWS, {
      ...enabledSnapshot(),
      dailyBudgets: {
        [OperationalAction.DISCOVER_NEWS]: { limit: -1, used: 0 },
      },
    }),
    /non-negative integer/,
  );

  assert.throws(
    () => assessOperationalAuthority(OperationalAction.SEND_SOCIAL_EMAIL, {
      ...enabledSnapshot(),
      retryBudgets: {
        [OperationalAction.SEND_SOCIAL_EMAIL]: { maxAttempts: 3, attemptsUsed: 1.5 },
      },
    }),
    /non-negative integer/,
  );
});
