import { AutonomyLevel } from '../common/enums';
import {
  OperationalAction,
  assessOperationalAuthority,
  type OperationalAuthorityAssessment,
  type OperationalAuthoritySnapshot,
} from './operational-authority';
import type { OperationalHealthAssessment } from './operational-health-policy';

const AUTONOMY_ORDER: Readonly<Record<AutonomyLevel, number>> = {
  [AutonomyLevel.LEVEL_0]: 0,
  [AutonomyLevel.LEVEL_1]: 1,
  [AutonomyLevel.LEVEL_2]: 2,
  [AutonomyLevel.LEVEL_3]: 3,
  [AutonomyLevel.LEVEL_4]: 4,
  [AutonomyLevel.LEVEL_5]: 5,
};

const AUTONOMY_BY_ORDER: readonly AutonomyLevel[] = [
  AutonomyLevel.LEVEL_0,
  AutonomyLevel.LEVEL_1,
  AutonomyLevel.LEVEL_2,
  AutonomyLevel.LEVEL_3,
  AutonomyLevel.LEVEL_4,
  AutonomyLevel.LEVEL_5,
];

export interface HealthConstrainedAutonomyResult {
  readonly configuredAutonomyLevel: AutonomyLevel;
  readonly healthAutonomyCeiling: AutonomyLevel | null;
  readonly effectiveAutonomyLevel: AutonomyLevel;
  readonly constrainedByHealth: boolean;
}

export interface HealthConstrainedAuthorityAssessment {
  readonly autonomy: HealthConstrainedAutonomyResult;
  readonly authority: OperationalAuthorityAssessment;
  readonly healthReasons: readonly string[];
}

export const constrainAutonomyByHealth = (
  configuredAutonomyLevel: AutonomyLevel,
  health: OperationalHealthAssessment,
): HealthConstrainedAutonomyResult => {
  const configuredOrder = AUTONOMY_ORDER[configuredAutonomyLevel];
  const ceiling = health.recommendedAutonomyCeiling;
  if (ceiling === null) {
    return {
      configuredAutonomyLevel,
      healthAutonomyCeiling: null,
      effectiveAutonomyLevel: configuredAutonomyLevel,
      constrainedByHealth: false,
    };
  }

  const effectiveOrder = Math.min(configuredOrder, AUTONOMY_ORDER[ceiling]);
  const effectiveAutonomyLevel = AUTONOMY_BY_ORDER[effectiveOrder];
  if (!effectiveAutonomyLevel) throw new RangeError('HEALTH_CONSTRAINED_AUTONOMY_INVALID');

  return {
    configuredAutonomyLevel,
    healthAutonomyCeiling: ceiling,
    effectiveAutonomyLevel,
    constrainedByHealth: effectiveOrder < configuredOrder,
  };
};

/**
 * Applies operational health as a ceiling before NA-10.1 authority evaluation.
 * Health may reduce effective autonomy, but never increases configured autonomy
 * and never bypasses modes, toggles, kill switches, capabilities or budgets.
 */
export const assessHealthConstrainedOperationalAuthority = ({
  action,
  snapshot,
  health,
}: {
  readonly action: OperationalAction;
  readonly snapshot: OperationalAuthoritySnapshot;
  readonly health: OperationalHealthAssessment;
}): HealthConstrainedAuthorityAssessment => {
  const autonomy = constrainAutonomyByHealth(snapshot.autonomyLevel, health);
  const authority = assessOperationalAuthority(action, {
    ...snapshot,
    autonomyLevel: autonomy.effectiveAutonomyLevel,
  });

  return {
    autonomy,
    authority,
    healthReasons: health.reasons,
  };
};
