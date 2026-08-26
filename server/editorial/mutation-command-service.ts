import { randomUUID } from 'node:crypto';
import {
  AuditAction,
  AuditActorType,
  AuditEntityType,
  type AuditLogEntry,
} from '../../domain/audit/audit';
import { validateAuditEntry } from '../../domain/audit/policy';
import type {
  AuditLogId,
  CanonicalStoryId,
  IsoUtcDateTime,
  OrganizationId,
} from '../../domain/common/types';
import {
  CanonicalStoryStatus,
  EditorialControlAction,
  assessEditorialControlAction,
  type EditorialControlSnapshot,
  type EditorialRole,
} from '../../domain/editorial';
import { PublicationStatus } from '../../domain/publications';
import {
  canTransitionCanonicalStory,
  canTransitionPublication,
} from '../../domain/state-machine/state-machine';

export interface EditorialMutationActor {
  readonly organizationId: OrganizationId;
  readonly actorId: string;
  readonly role: EditorialRole;
}

export interface EditorialMutationRecord {
  readonly storyId: CanonicalStoryId;
  readonly revision: string;
  readonly snapshot: EditorialControlSnapshot;
}

export interface EditorialMutationPatch {
  readonly storyStatus?: CanonicalStoryStatus;
  readonly publicationStatus?: PublicationStatus;
  readonly isBreaking?: boolean;
}

export interface EditorialMutationCommit {
  readonly organizationId: OrganizationId;
  readonly storyId: CanonicalStoryId;
  readonly expectedRevision: string;
  readonly patch: EditorialMutationPatch;
  readonly auditEntry: AuditLogEntry;
}

export interface EditorialMutationUnitOfWork {
  loadForMutation(
    organizationId: OrganizationId,
    storyId: CanonicalStoryId,
  ): Promise<EditorialMutationRecord | null>;
  commitMutation(command: EditorialMutationCommit): Promise<
    | { readonly ok: true; readonly revision: string }
    | { readonly ok: false; readonly code: 'REVISION_CONFLICT' | 'COMMIT_FAILED' }
  >;
}

export interface EditorialMutationCommand {
  readonly actor: EditorialMutationActor;
  readonly storyId: CanonicalStoryId;
  readonly action: EditorialControlAction;
  readonly expectedRevision?: string | null;
  readonly reason?: string | null;
}

export type EditorialMutationCommandResult =
  | {
      readonly ok: true;
      readonly action: EditorialControlAction;
      readonly storyId: CanonicalStoryId;
      readonly revision: string;
    }
  | {
      readonly ok: false;
      readonly code:
        | 'EDITORIAL_STORY_NOT_FOUND'
        | 'EDITORIAL_ACTION_NOT_ALLOWED'
        | 'EDITORIAL_STALE_CLIENT_REVISION'
        | 'EDITORIAL_CONCURRENT_MODIFICATION'
        | 'EDITORIAL_MUTATION_INVALID'
        | 'EDITORIAL_MUTATION_COMMIT_FAILED';
      readonly reasons: readonly string[];
    };

export interface EditorialMutationCommandService {
  execute(command: EditorialMutationCommand): Promise<EditorialMutationCommandResult>;
}

const resolvePreparationTarget = (from: PublicationStatus): PublicationStatus | null => {
  if (canTransitionPublication(from, PublicationStatus.READY).ok) return PublicationStatus.READY;
  if (canTransitionPublication(from, PublicationStatus.SCHEDULED).ok) return PublicationStatus.SCHEDULED;
  return null;
};

const buildPatch = (
  action: EditorialControlAction,
  snapshot: EditorialControlSnapshot,
): EditorialMutationPatch | null => {
  switch (action) {
    case EditorialControlAction.REQUEST_REVISION:
      return canTransitionCanonicalStory(snapshot.storyStatus, CanonicalStoryStatus.DRAFTING).ok
        ? { storyStatus: CanonicalStoryStatus.DRAFTING }
        : null;
    case EditorialControlAction.APPROVE_STORY:
      return canTransitionCanonicalStory(snapshot.storyStatus, CanonicalStoryStatus.APPROVED).ok
        ? { storyStatus: CanonicalStoryStatus.APPROVED }
        : null;
    case EditorialControlAction.REJECT_STORY:
      return canTransitionCanonicalStory(snapshot.storyStatus, CanonicalStoryStatus.REJECTED).ok
        ? { storyStatus: CanonicalStoryStatus.REJECTED }
        : null;
    case EditorialControlAction.MARK_BREAKING:
      return { isBreaking: true };
    case EditorialControlAction.UNMARK_BREAKING:
      return { isBreaking: false };
    case EditorialControlAction.PREPARE_WEB_PUBLICATION: {
      const target = resolvePreparationTarget(snapshot.publicationStatus);
      return target ? { publicationStatus: target } : null;
    }
    case EditorialControlAction.PUBLISH_WEB_NOW:
      return canTransitionPublication(snapshot.publicationStatus, PublicationStatus.PUBLISHING).ok
        ? { publicationStatus: PublicationStatus.PUBLISHING }
        : null;
  }
};

const auditActionFor = (
  action: EditorialControlAction,
  patch: EditorialMutationPatch,
): AuditAction => {
  switch (action) {
    case EditorialControlAction.APPROVE_STORY:
      return AuditAction.APPROVED;
    case EditorialControlAction.REJECT_STORY:
      return AuditAction.REJECTED;
    case EditorialControlAction.PUBLISH_WEB_NOW:
      return AuditAction.PUBLISH_STARTED;
    case EditorialControlAction.PREPARE_WEB_PUBLICATION:
      return patch.publicationStatus === PublicationStatus.SCHEDULED
        ? AuditAction.SCHEDULED
        : AuditAction.STATUS_CHANGED;
    default:
      return AuditAction.UPDATED;
  }
};

const stateChangeFor = (
  snapshot: EditorialControlSnapshot,
  patch: EditorialMutationPatch,
): { readonly fromState: string | null; readonly toState: string | null } | null => {
  if (patch.storyStatus) {
    return { fromState: snapshot.storyStatus, toState: patch.storyStatus };
  }
  if (patch.publicationStatus) {
    return { fromState: snapshot.publicationStatus, toState: patch.publicationStatus };
  }
  return null;
};

const buildAuditEntry = (
  command: EditorialMutationCommand,
  snapshot: EditorialControlSnapshot,
  patch: EditorialMutationPatch,
  now: IsoUtcDateTime,
): AuditLogEntry => ({
  id: randomUUID() as AuditLogId,
  organizationId: command.actor.organizationId,
  entityType: AuditEntityType.CANONICAL_STORY,
  entityId: command.storyId,
  action: auditActionFor(command.action, patch),
  actor: {
    type: AuditActorType.HUMAN,
    id: command.actor.actorId,
    displayName: null,
  },
  stateChange: stateChangeFor(snapshot, patch),
  decisionContext: {
    decision: command.action,
    ruleId: 'EDITORIAL_CONTROL_ACTION_GATE',
    reason: command.reason?.trim() || null,
  },
  errorContext: null,
  correlationId: randomUUID(),
  metadata: {
    editorialAction: command.action,
    editorialRole: command.actor.role,
    isBreakingBefore: snapshot.isBreaking,
    isBreakingAfter: patch.isBreaking ?? snapshot.isBreaking,
  },
  occurredAt: now,
});

export const createEditorialMutationCommandService = (
  unitOfWork: EditorialMutationUnitOfWork,
  now: () => IsoUtcDateTime = () => new Date().toISOString() as IsoUtcDateTime,
): EditorialMutationCommandService => ({
  async execute(command): Promise<EditorialMutationCommandResult> {
    const record = await unitOfWork.loadForMutation(
      command.actor.organizationId,
      command.storyId,
    );

    if (!record) {
      return {
        ok: false,
        code: 'EDITORIAL_STORY_NOT_FOUND',
        reasons: ['STORY_NOT_FOUND_IN_ACTOR_ORGANIZATION'],
      };
    }

    if (command.expectedRevision && command.expectedRevision !== record.revision) {
      return {
        ok: false,
        code: 'EDITORIAL_STALE_CLIENT_REVISION',
        reasons: ['CLIENT_REVISION_DOES_NOT_MATCH_FRESH_SNAPSHOT'],
      };
    }

    const assessment = assessEditorialControlAction(
      command.actor.role,
      command.action,
      record.snapshot,
    );

    if (!assessment.allowed) {
      return {
        ok: false,
        code: 'EDITORIAL_ACTION_NOT_ALLOWED',
        reasons: assessment.reasons,
      };
    }

    const patch = buildPatch(command.action, record.snapshot);
    if (!patch) {
      return {
        ok: false,
        code: 'EDITORIAL_MUTATION_INVALID',
        reasons: ['AUTHORIZED_ACTION_COULD_NOT_RESOLVE_VALID_MUTATION'],
      };
    }

    const auditEntry = buildAuditEntry(command, record.snapshot, patch, now());
    const auditValidation = validateAuditEntry(auditEntry);
    if (!auditValidation.valid) {
      return {
        ok: false,
        code: 'EDITORIAL_MUTATION_INVALID',
        reasons: auditValidation.errors,
      };
    }

    const commit = await unitOfWork.commitMutation({
      organizationId: command.actor.organizationId,
      storyId: command.storyId,
      expectedRevision: record.revision,
      patch,
      auditEntry,
    });

    if ('code' in commit) {
      return commit.code === 'REVISION_CONFLICT'
        ? {
            ok: false,
            code: 'EDITORIAL_CONCURRENT_MODIFICATION',
            reasons: ['FRESH_SNAPSHOT_CHANGED_BEFORE_COMMIT'],
          }
        : {
            ok: false,
            code: 'EDITORIAL_MUTATION_COMMIT_FAILED',
            reasons: ['ATOMIC_MUTATION_AND_AUDIT_COMMIT_FAILED'],
          };
    }

    return {
      ok: true,
      action: command.action,
      storyId: command.storyId,
      revision: commit.revision,
    };
  },
});
