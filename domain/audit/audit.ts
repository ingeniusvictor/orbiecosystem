import type {
  AuditLogId,
  IsoUtcDateTime,
  OrganizationId,
} from '../common/types';

export enum AuditActorType {
  HUMAN = 'HUMAN',
  AI = 'AI',
  SYSTEM = 'SYSTEM',
  CRON = 'CRON',
  EXTERNAL_API = 'EXTERNAL_API',
}

export enum AuditAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  VERIFIED = 'VERIFIED',
  SCORED = 'SCORED',
  DRAFT_GENERATED = 'DRAFT_GENERATED',
  DRAFT_EDITED = 'DRAFT_EDITED',
  VISUAL_GENERATED = 'VISUAL_GENERATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SCHEDULED = 'SCHEDULED',
  PUBLISH_STARTED = 'PUBLISH_STARTED',
  PUBLISH_SUCCEEDED = 'PUBLISH_SUCCEEDED',
  PUBLISH_FAILED = 'PUBLISH_FAILED',
  RETRY_REQUESTED = 'RETRY_REQUESTED',
  POLICY_ALLOWED = 'POLICY_ALLOWED',
  POLICY_WARNED = 'POLICY_WARNED',
  POLICY_BLOCKED = 'POLICY_BLOCKED',
  POLICY_DEFERRED = 'POLICY_DEFERRED',
  KILL_SWITCH_ENABLED = 'KILL_SWITCH_ENABLED',
  KILL_SWITCH_DISABLED = 'KILL_SWITCH_DISABLED',
}

export enum AuditEntityType {
  NEWS_ITEM = 'NEWS_ITEM',
  EVENT = 'EVENT',
  VERIFICATION_RECORD = 'VERIFICATION_RECORD',
  CANONICAL_STORY = 'CANONICAL_STORY',
  SOCIAL_PACKAGE = 'SOCIAL_PACKAGE',
  PUBLICATION = 'PUBLICATION',
  SYSTEM_SETTING = 'SYSTEM_SETTING',
}

export interface AuditActor {
  readonly type: AuditActorType;
  readonly id: string;
  readonly displayName: string | null;
}

export interface AuditStateChange {
  readonly fromState: string | null;
  readonly toState: string | null;
}

export interface AuditDecisionContext {
  readonly decision: string | null;
  readonly ruleId: string | null;
  readonly reason: string | null;
}

export interface AuditErrorContext {
  readonly code: string;
  readonly message: string;
  readonly retryable: boolean | null;
}

export interface AuditLogEntry {
  readonly id: AuditLogId;
  readonly organizationId: OrganizationId;
  readonly entityType: AuditEntityType;
  readonly entityId: string;
  readonly action: AuditAction;
  readonly actor: AuditActor;
  readonly stateChange: AuditStateChange | null;
  readonly decisionContext: AuditDecisionContext | null;
  readonly errorContext: AuditErrorContext | null;
  readonly correlationId: string | null;
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
  readonly occurredAt: IsoUtcDateTime;
}

export interface AuditQuery {
  readonly organizationId: OrganizationId;
  readonly entityType?: AuditEntityType;
  readonly entityId?: string;
  readonly actorType?: AuditActorType;
  readonly action?: AuditAction;
  readonly correlationId?: string;
  readonly from?: IsoUtcDateTime;
  readonly to?: IsoUtcDateTime;
}

export interface AuditRepository {
  append(entry: AuditLogEntry): Promise<void>;
  find(query: AuditQuery): Promise<readonly AuditLogEntry[]>;
}
