import {
  OperationalDecision,
  assessOperationalAuthority,
  type OperationalAction,
  type OperationalAuthoritySnapshot,
} from '../../domain/operations/operational-authority';
import type { ProductionRuntimeConfiguration } from './production-runtime-config';

export enum ProductionRuntimeReadinessStatus {
  DISABLED = 'DISABLED',
  SAFE_IDLE = 'SAFE_IDLE',
  PARTIAL = 'PARTIAL',
  READY = 'READY',
  DEGRADED = 'DEGRADED',
}

export interface ProductionRuntimeReadinessSnapshot {
  readonly status: ProductionRuntimeReadinessStatus;
  readonly configuredActions: readonly OperationalAction[];
  readonly allowedActions: readonly OperationalAction[];
  readonly deferredActions: readonly OperationalAction[];
  readonly blockedActions: readonly OperationalAction[];
  readonly reasons: readonly string[];
}

/** Observability only; this function never grants operational authority. */
export const assessProductionRuntimeReadiness = ({
  runtime,
  authoritySnapshot,
  configuredActions,
}: {
  readonly runtime: ProductionRuntimeConfiguration;
  readonly authoritySnapshot: OperationalAuthoritySnapshot;
  readonly configuredActions: readonly OperationalAction[];
}): ProductionRuntimeReadinessSnapshot => {
  if (!runtime.enabled) {
    return {
      status: ProductionRuntimeReadinessStatus.DISABLED,
      configuredActions: [],
      allowedActions: [],
      deferredActions: [],
      blockedActions: [],
      reasons: ['RUNTIME_DISABLED'],
    };
  }

  const allowedActions: OperationalAction[] = [];
  const deferredActions: OperationalAction[] = [];
  const blockedActions: OperationalAction[] = [];
  const reasons: string[] = [];

  for (const action of configuredActions) {
    const assessment = assessOperationalAuthority(action, authoritySnapshot);
    if (assessment.decision === OperationalDecision.ALLOW) allowedActions.push(action);
    if (assessment.decision === OperationalDecision.DEFER) deferredActions.push(action);
    if (assessment.decision === OperationalDecision.BLOCK) blockedActions.push(action);
    for (const reason of assessment.reasons) reasons.push(`${action}:${reason}`);
  }

  let status: ProductionRuntimeReadinessStatus;
  if (blockedActions.length > 0) status = ProductionRuntimeReadinessStatus.DEGRADED;
  else if (configuredActions.length === 0 || allowedActions.length === 0) status = ProductionRuntimeReadinessStatus.SAFE_IDLE;
  else if (allowedActions.length < configuredActions.length) status = ProductionRuntimeReadinessStatus.PARTIAL;
  else status = ProductionRuntimeReadinessStatus.READY;

  return {
    status,
    configuredActions: [...configuredActions],
    allowedActions,
    deferredActions,
    blockedActions,
    reasons: [...new Set(reasons)],
  };
};
