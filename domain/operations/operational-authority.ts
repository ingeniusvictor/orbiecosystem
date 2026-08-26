import {
  AutonomyLevel,
  CapabilityStatus,
  SystemCapability,
  SystemMode,
} from '../common/enums';

export enum OperationalAction {
  DISCOVER_NEWS = 'DISCOVER_NEWS',
  VERIFY_NEWS = 'VERIFY_NEWS',
  GENERATE_DRAFT = 'GENERATE_DRAFT',
  GENERATE_IMAGE = 'GENERATE_IMAGE',
  SCHEDULE_WEB_PUBLICATION = 'SCHEDULE_WEB_PUBLICATION',
  PUBLISH_WEB = 'PUBLISH_WEB',
  PREPARE_SOCIAL = 'PREPARE_SOCIAL',
  SEND_SOCIAL_EMAIL = 'SEND_SOCIAL_EMAIL',
  PUBLISH_FACEBOOK = 'PUBLISH_FACEBOOK',
  PUBLISH_INSTAGRAM = 'PUBLISH_INSTAGRAM',
}

export enum AutomationToggle {
  AUTO_DISCOVERY = 'AUTO_DISCOVERY',
  AUTO_VERIFICATION = 'AUTO_VERIFICATION',
  AUTO_DRAFT = 'AUTO_DRAFT',
  AUTO_IMAGE = 'AUTO_IMAGE',
  AUTO_SCHEDULE = 'AUTO_SCHEDULE',
  AUTO_PUBLISH_WEB = 'AUTO_PUBLISH_WEB',
  AUTO_PREPARE_SOCIAL = 'AUTO_PREPARE_SOCIAL',
  AUTO_EMAIL = 'AUTO_EMAIL',
  AUTO_PUBLISH_FACEBOOK = 'AUTO_PUBLISH_FACEBOOK',
  AUTO_PUBLISH_INSTAGRAM = 'AUTO_PUBLISH_INSTAGRAM',
}

export enum KillSwitchScope {
  GLOBAL = 'GLOBAL',
  ALL_PUBLISHING = 'ALL_PUBLISHING',
  FACEBOOK = 'FACEBOOK',
  INSTAGRAM = 'INSTAGRAM',
  NEWS_DISCOVERY = 'NEWS_DISCOVERY',
  AI_GENERATION = 'AI_GENERATION',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  EMAIL_DELIVERY = 'EMAIL_DELIVERY',
}

export enum OperationalDecision {
  ALLOW = 'ALLOW',
  DEFER = 'DEFER',
  BLOCK = 'BLOCK',
}

export interface OperationalDailyBudget {
  readonly limit: number;
  readonly used: number;
}

export interface OperationalRetryBudget {
  readonly maxAttempts: number;
  readonly attemptsUsed: number;
}

export interface OperationalAuthoritySnapshot {
  readonly systemMode: SystemMode;
  readonly autonomyLevel: AutonomyLevel;
  readonly toggles: Readonly<Partial<Record<AutomationToggle, boolean>>>;
  readonly activeKillSwitches: readonly KillSwitchScope[];
  readonly capabilities: Readonly<Partial<Record<SystemCapability, CapabilityStatus>>>;
  readonly dailyBudgets: Readonly<Partial<Record<OperationalAction, OperationalDailyBudget>>>;
  readonly retryBudgets: Readonly<Partial<Record<OperationalAction, OperationalRetryBudget>>>;
}

export interface OperationalAuthorityAssessment {
  readonly action: OperationalAction;
  readonly decision: OperationalDecision;
  readonly reasons: readonly string[];
}

interface OperationalRequirement {
  readonly toggle: AutomationToggle;
  readonly capability: SystemCapability;
  readonly minimumAutonomy: AutonomyLevel;
  readonly mutating: boolean;
  readonly publishing: boolean;
  readonly killSwitches: readonly KillSwitchScope[];
}

const AUTONOMY_ORDER: Readonly<Record<AutonomyLevel, number>> = {
  [AutonomyLevel.LEVEL_0]: 0,
  [AutonomyLevel.LEVEL_1]: 1,
  [AutonomyLevel.LEVEL_2]: 2,
  [AutonomyLevel.LEVEL_3]: 3,
  [AutonomyLevel.LEVEL_4]: 4,
  [AutonomyLevel.LEVEL_5]: 5,
};

const REQUIREMENTS: Readonly<Record<OperationalAction, OperationalRequirement>> = {
  [OperationalAction.DISCOVER_NEWS]: {
    toggle: AutomationToggle.AUTO_DISCOVERY,
    capability: SystemCapability.NEWS_DISCOVERY,
    minimumAutonomy: AutonomyLevel.LEVEL_1,
    mutating: false,
    publishing: false,
    killSwitches: [KillSwitchScope.GLOBAL, KillSwitchScope.NEWS_DISCOVERY],
  },
  [OperationalAction.VERIFY_NEWS]: {
    toggle: AutomationToggle.AUTO_VERIFICATION,
    capability: SystemCapability.VERIFICATION,
    minimumAutonomy: AutonomyLevel.LEVEL_2,
    mutating: false,
    publishing: false,
    killSwitches: [KillSwitchScope.GLOBAL],
  },
  [OperationalAction.GENERATE_DRAFT]: {
    toggle: AutomationToggle.AUTO_DRAFT,
    capability: SystemCapability.EDITORIAL_GENERATION,
    minimumAutonomy: AutonomyLevel.LEVEL_3,
    mutating: true,
    publishing: false,
    killSwitches: [KillSwitchScope.GLOBAL, KillSwitchScope.AI_GENERATION],
  },
  [OperationalAction.GENERATE_IMAGE]: {
    toggle: AutomationToggle.AUTO_IMAGE,
    capability: SystemCapability.IMAGE_GENERATION,
    minimumAutonomy: AutonomyLevel.LEVEL_3,
    mutating: true,
    publishing: false,
    killSwitches: [KillSwitchScope.GLOBAL, KillSwitchScope.IMAGE_GENERATION],
  },
  [OperationalAction.SCHEDULE_WEB_PUBLICATION]: {
    toggle: AutomationToggle.AUTO_SCHEDULE,
    capability: SystemCapability.SCHEDULER,
    minimumAutonomy: AutonomyLevel.LEVEL_4,
    mutating: true,
    publishing: true,
    killSwitches: [KillSwitchScope.GLOBAL, KillSwitchScope.ALL_PUBLISHING],
  },
  [OperationalAction.PUBLISH_WEB]: {
    toggle: AutomationToggle.AUTO_PUBLISH_WEB,
    capability: SystemCapability.PUBLIC_NEWS_PORTAL,
    minimumAutonomy: AutonomyLevel.LEVEL_5,
    mutating: true,
    publishing: true,
    killSwitches: [KillSwitchScope.GLOBAL, KillSwitchScope.ALL_PUBLISHING],
  },
  [OperationalAction.PREPARE_SOCIAL]: {
    toggle: AutomationToggle.AUTO_PREPARE_SOCIAL,
    capability: SystemCapability.EDITORIAL_GENERATION,
    minimumAutonomy: AutonomyLevel.LEVEL_3,
    mutating: true,
    publishing: false,
    killSwitches: [KillSwitchScope.GLOBAL, KillSwitchScope.AI_GENERATION],
  },
  [OperationalAction.SEND_SOCIAL_EMAIL]: {
    toggle: AutomationToggle.AUTO_EMAIL,
    capability: SystemCapability.EMAIL_DELIVERY,
    minimumAutonomy: AutonomyLevel.LEVEL_4,
    mutating: true,
    publishing: false,
    killSwitches: [KillSwitchScope.GLOBAL, KillSwitchScope.EMAIL_DELIVERY],
  },
  [OperationalAction.PUBLISH_FACEBOOK]: {
    toggle: AutomationToggle.AUTO_PUBLISH_FACEBOOK,
    capability: SystemCapability.FACEBOOK_PUBLISHING,
    minimumAutonomy: AutonomyLevel.LEVEL_5,
    mutating: true,
    publishing: true,
    killSwitches: [KillSwitchScope.GLOBAL, KillSwitchScope.ALL_PUBLISHING, KillSwitchScope.FACEBOOK],
  },
  [OperationalAction.PUBLISH_INSTAGRAM]: {
    toggle: AutomationToggle.AUTO_PUBLISH_INSTAGRAM,
    capability: SystemCapability.INSTAGRAM_PUBLISHING,
    minimumAutonomy: AutonomyLevel.LEVEL_5,
    mutating: true,
    publishing: true,
    killSwitches: [KillSwitchScope.GLOBAL, KillSwitchScope.ALL_PUBLISHING, KillSwitchScope.INSTAGRAM],
  },
};

const assertNonNegativeInteger = (label: string, value: number): void => {
  if (!Number.isInteger(value) || value < 0) throw new RangeError(`${label} must be a non-negative integer.`);
};

const validateBudget = (action: OperationalAction, snapshot: OperationalAuthoritySnapshot): void => {
  const daily = snapshot.dailyBudgets[action];
  if (daily) {
    assertNonNegativeInteger(`${action} daily limit`, daily.limit);
    assertNonNegativeInteger(`${action} daily used`, daily.used);
  }
  const retry = snapshot.retryBudgets[action];
  if (retry) {
    assertNonNegativeInteger(`${action} max attempts`, retry.maxAttempts);
    assertNonNegativeInteger(`${action} attempts used`, retry.attemptsUsed);
  }
};

/**
 * Determines whether autonomous orchestration may ATTEMPT an operation.
 * This is not publication authority. Downstream editorial, visual, social,
 * state-machine, persistence and audit gates remain mandatory.
 */
export const assessOperationalAuthority = (
  action: OperationalAction,
  snapshot: OperationalAuthoritySnapshot,
): OperationalAuthorityAssessment => {
  validateBudget(action, snapshot);
  const requirement = REQUIREMENTS[action];
  const blockReasons: string[] = [];
  const deferReasons: string[] = [];

  if (snapshot.systemMode === SystemMode.EMERGENCY_STOP) {
    blockReasons.push('SYSTEM_MODE_EMERGENCY_STOP');
  }

  const activeKills = new Set(snapshot.activeKillSwitches);
  for (const scope of requirement.killSwitches) {
    if (activeKills.has(scope)) blockReasons.push(`KILL_SWITCH_${scope}`);
  }

  if (blockReasons.length > 0) {
    return { action, decision: OperationalDecision.BLOCK, reasons: [...new Set(blockReasons)] };
  }

  if (
    requirement.mutating &&
    (snapshot.systemMode === SystemMode.READ_ONLY || snapshot.systemMode === SystemMode.MAINTENANCE)
  ) {
    deferReasons.push(`SYSTEM_MODE_${snapshot.systemMode}_PREVENTS_MUTATION`);
  }

  if (snapshot.toggles[requirement.toggle] !== true) {
    deferReasons.push(`AUTOMATION_TOGGLE_${requirement.toggle}_DISABLED`);
  }

  if (AUTONOMY_ORDER[snapshot.autonomyLevel] < AUTONOMY_ORDER[requirement.minimumAutonomy]) {
    deferReasons.push(`AUTONOMY_LEVEL_BELOW_${requirement.minimumAutonomy}`);
  }

  const capabilityStatus = snapshot.capabilities[requirement.capability] ?? CapabilityStatus.NOT_CONFIGURED;
  if (capabilityStatus !== CapabilityStatus.AVAILABLE) {
    deferReasons.push(`CAPABILITY_${requirement.capability}_${capabilityStatus}`);
  }

  const daily = snapshot.dailyBudgets[action];
  if (daily && daily.used >= daily.limit) {
    deferReasons.push('DAILY_OPERATION_LIMIT_REACHED');
  }

  const retry = snapshot.retryBudgets[action];
  if (retry && retry.attemptsUsed >= retry.maxAttempts) {
    deferReasons.push('RETRY_BUDGET_EXHAUSTED');
  }

  if (deferReasons.length > 0) {
    return { action, decision: OperationalDecision.DEFER, reasons: [...new Set(deferReasons)] };
  }

  return { action, decision: OperationalDecision.ALLOW, reasons: [] };
};

export const getOperationalRequirement = (
  action: OperationalAction,
): Readonly<OperationalRequirement> => REQUIREMENTS[action];
