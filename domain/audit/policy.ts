import { AuditAction, AuditActorType, AuditLogEntry } from './audit';

export interface AuditValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const ACTIONS_REQUIRING_STATE_CHANGE = new Set<AuditAction>([
  AuditAction.STATUS_CHANGED,
]);

const ACTIONS_REQUIRING_DECISION = new Set<AuditAction>([
  AuditAction.POLICY_ALLOWED,
  AuditAction.POLICY_WARNED,
  AuditAction.POLICY_BLOCKED,
  AuditAction.POLICY_DEFERRED,
]);

const ACTIONS_REQUIRING_ERROR = new Set<AuditAction>([
  AuditAction.PUBLISH_FAILED,
]);

export const validateAuditEntry = (entry: AuditLogEntry): AuditValidationResult => {
  const errors: string[] = [];

  if (!entry.entityId.trim()) errors.push('ENTITY_ID_REQUIRED');
  if (!entry.actor.id.trim()) errors.push('ACTOR_ID_REQUIRED');

  if (ACTIONS_REQUIRING_STATE_CHANGE.has(entry.action)) {
    if (!entry.stateChange) {
      errors.push('STATE_CHANGE_REQUIRED');
    } else if (entry.stateChange.fromState === entry.stateChange.toState) {
      errors.push('STATE_CHANGE_MUST_CHANGE_STATE');
    }
  }

  if (ACTIONS_REQUIRING_DECISION.has(entry.action) && !entry.decisionContext) {
    errors.push('DECISION_CONTEXT_REQUIRED');
  }

  if (ACTIONS_REQUIRING_ERROR.has(entry.action) && !entry.errorContext) {
    errors.push('ERROR_CONTEXT_REQUIRED');
  }

  if (entry.actor.type === AuditActorType.AI && entry.action === AuditAction.APPROVED) {
    errors.push('AI_CANNOT_BE_FINAL_APPROVER');
  }

  return { valid: errors.length === 0, errors };
};

export const isImmutableAuditAction = (_action: AuditAction): boolean => true;
