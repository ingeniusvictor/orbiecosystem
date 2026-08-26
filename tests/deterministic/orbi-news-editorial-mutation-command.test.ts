import test from 'node:test';
import assert from 'node:assert/strict';

import { AuditAction, AuditActorType } from '../../domain/audit/audit';
import type { CanonicalStoryId, IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import {
  EditorialControlAction,
  EditorialRole,
  type EditorialControlSnapshot,
} from '../../domain/editorial/control-center';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { OrbiEditorialBand } from '../../domain/editorial/scoring';
import { PublicationStatus } from '../../domain/publications/publication';
import {
  createEditorialMutationCommandService,
  type EditorialMutationCommit,
  type EditorialMutationRecord,
  type EditorialMutationUnitOfWork,
} from '../../server/editorial/mutation-command-service';

const org = 'org-orbi' as OrganizationId;
const otherOrg = 'org-other' as OrganizationId;
const storyId = 'story-001' as CanonicalStoryId;
const fixedNow = '2026-08-26T16:30:00Z' as IsoUtcDateTime;

const snapshot = (overrides: Partial<EditorialControlSnapshot> = {}): EditorialControlSnapshot => ({
  storyStatus: CanonicalStoryStatus.READY_FOR_REVIEW,
  publicationStatus: PublicationStatus.NOT_SCHEDULED,
  editorialGate: {
    decision: IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW,
    editorialBand: OrbiEditorialBand.PRIORITY,
    reasons: ['HUMAN_EDITORIAL_REVIEW_REQUIRED'],
  },
  breakingEligibility: {
    eligible: false,
    reasons: ['SOCIAL_SCORE_BELOW_BREAKING_THRESHOLD'],
  },
  isBreaking: false,
  ...overrides,
});

const record = (overrides: Partial<EditorialMutationRecord> = {}): EditorialMutationRecord => ({
  storyId,
  revision: 'rev-1',
  snapshot: snapshot(),
  ...overrides,
});

const actor = (role: EditorialRole = EditorialRole.REVIEWER, organizationId = org) => ({
  organizationId,
  actorId: 'actor-victor',
  role,
});

class MemoryUnitOfWork implements EditorialMutationUnitOfWork {
  public loadedOrganization: OrganizationId | null = null;
  public committed: EditorialMutationCommit | null = null;
  public conflict = false;
  public failCommit = false;

  constructor(public current: EditorialMutationRecord | null) {}

  async loadForMutation(organizationId: OrganizationId): Promise<EditorialMutationRecord | null> {
    this.loadedOrganization = organizationId;
    if (organizationId !== org) return null;
    return this.current;
  }

  async commitMutation(command: EditorialMutationCommit) {
    this.committed = command;
    if (this.conflict) return { ok: false as const, code: 'REVISION_CONFLICT' as const };
    if (this.failCommit) return { ok: false as const, code: 'COMMIT_FAILED' as const };
    return { ok: true as const, revision: 'rev-2' };
  }
}

test('mutation command scopes the fresh read by actor organization', async () => {
  const uow = new MemoryUnitOfWork(record());
  const service = createEditorialMutationCommandService(uow, () => fixedNow);

  const result = await service.execute({
    actor: actor(EditorialRole.REVIEWER, otherOrg),
    storyId,
    action: EditorialControlAction.APPROVE_STORY,
  });

  assert.equal(uow.loadedOrganization, otherOrg);
  assert.deepEqual(result, {
    ok: false,
    code: 'EDITORIAL_STORY_NOT_FOUND',
    reasons: ['STORY_NOT_FOUND_IN_ACTOR_ORGANIZATION'],
  });
  assert.equal(uow.committed, null);
});

test('stale client revision is rejected before authorization or commit', async () => {
  const uow = new MemoryUnitOfWork(record());
  const service = createEditorialMutationCommandService(uow, () => fixedNow);

  const result = await service.execute({
    actor: actor(),
    storyId,
    action: EditorialControlAction.APPROVE_STORY,
    expectedRevision: 'rev-old',
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'EDITORIAL_STALE_CLIENT_REVISION');
  assert.equal(uow.committed, null);
});

test('role and deterministic gate can block a mutation even with a valid fresh record', async () => {
  const uow = new MemoryUnitOfWork(record({
    snapshot: snapshot({
      storyStatus: CanonicalStoryStatus.APPROVED,
      publicationStatus: PublicationStatus.READY,
      editorialGate: {
        decision: IntegratedEditorialDecision.ALLOW_EDITORIAL,
        editorialBand: OrbiEditorialBand.PRIORITY,
        reasons: ['EDITORIAL_GATE_REQUIREMENTS_SATISFIED'],
      },
    }),
  }));
  const service = createEditorialMutationCommandService(uow, () => fixedNow);

  const result = await service.execute({
    actor: actor(EditorialRole.EDITOR),
    storyId,
    action: EditorialControlAction.PUBLISH_WEB_NOW,
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, 'EDITORIAL_ACTION_NOT_ALLOWED');
    assert.ok(result.reasons.includes('ROLE_NOT_AUTHORIZED'));
  }
  assert.equal(uow.committed, null);
});

test('approved review is committed atomically with a valid human audit entry', async () => {
  const uow = new MemoryUnitOfWork(record());
  const service = createEditorialMutationCommandService(uow, () => fixedNow);

  const result = await service.execute({
    actor: actor(EditorialRole.REVIEWER),
    storyId,
    action: EditorialControlAction.APPROVE_STORY,
    expectedRevision: 'rev-1',
    reason: 'Revisión humana completada',
  });

  assert.deepEqual(result, {
    ok: true,
    action: EditorialControlAction.APPROVE_STORY,
    storyId,
    revision: 'rev-2',
  });
  assert.ok(uow.committed);
  assert.equal(uow.committed?.organizationId, org);
  assert.equal(uow.committed?.expectedRevision, 'rev-1');
  assert.equal(uow.committed?.patch.storyStatus, CanonicalStoryStatus.APPROVED);
  assert.equal(uow.committed?.auditEntry.action, AuditAction.APPROVED);
  assert.equal(uow.committed?.auditEntry.actor.type, AuditActorType.HUMAN);
  assert.equal(uow.committed?.auditEntry.actor.id, 'actor-victor');
  assert.deepEqual(uow.committed?.auditEntry.stateChange, {
    fromState: CanonicalStoryStatus.READY_FOR_REVIEW,
    toState: CanonicalStoryStatus.APPROVED,
  });
  assert.equal(uow.committed?.auditEntry.occurredAt, fixedNow);
});

test('owner publish-now transitions READY publication to PUBLISHING with audit', async () => {
  const uow = new MemoryUnitOfWork(record({
    snapshot: snapshot({
      storyStatus: CanonicalStoryStatus.APPROVED,
      publicationStatus: PublicationStatus.READY,
      editorialGate: {
        decision: IntegratedEditorialDecision.ALLOW_EDITORIAL,
        editorialBand: OrbiEditorialBand.PRIORITY,
        reasons: ['EDITORIAL_GATE_REQUIREMENTS_SATISFIED'],
      },
    }),
  }));
  const service = createEditorialMutationCommandService(uow, () => fixedNow);

  const result = await service.execute({
    actor: actor(EditorialRole.OWNER),
    storyId,
    action: EditorialControlAction.PUBLISH_WEB_NOW,
  });

  assert.equal(result.ok, true);
  assert.equal(uow.committed?.patch.publicationStatus, PublicationStatus.PUBLISHING);
  assert.equal(uow.committed?.auditEntry.action, AuditAction.PUBLISH_STARTED);
  assert.deepEqual(uow.committed?.auditEntry.stateChange, {
    fromState: PublicationStatus.READY,
    toState: PublicationStatus.PUBLISHING,
  });
});

test('breaking mutation is auditable but does not fabricate a state transition', async () => {
  const uow = new MemoryUnitOfWork(record({
    snapshot: snapshot({
      editorialGate: {
        decision: IntegratedEditorialDecision.ALLOW_EDITORIAL,
        editorialBand: OrbiEditorialBand.BREAKING_CANDIDATE,
        reasons: ['EDITORIAL_GATE_REQUIREMENTS_SATISFIED'],
      },
      breakingEligibility: { eligible: true, reasons: [] },
    }),
  }));
  const service = createEditorialMutationCommandService(uow, () => fixedNow);

  const result = await service.execute({
    actor: actor(EditorialRole.EDITOR),
    storyId,
    action: EditorialControlAction.MARK_BREAKING,
  });

  assert.equal(result.ok, true);
  assert.equal(uow.committed?.patch.isBreaking, true);
  assert.equal(uow.committed?.auditEntry.action, AuditAction.UPDATED);
  assert.equal(uow.committed?.auditEntry.stateChange, null);
});

test('revision conflict at atomic commit is surfaced as concurrent modification', async () => {
  const uow = new MemoryUnitOfWork(record());
  uow.conflict = true;
  const service = createEditorialMutationCommandService(uow, () => fixedNow);

  const result = await service.execute({
    actor: actor(),
    storyId,
    action: EditorialControlAction.APPROVE_STORY,
  });

  assert.deepEqual(result, {
    ok: false,
    code: 'EDITORIAL_CONCURRENT_MODIFICATION',
    reasons: ['FRESH_SNAPSHOT_CHANGED_BEFORE_COMMIT'],
  });
});

test('atomic commit failure never reports mutation success', async () => {
  const uow = new MemoryUnitOfWork(record());
  uow.failCommit = true;
  const service = createEditorialMutationCommandService(uow, () => fixedNow);

  const result = await service.execute({
    actor: actor(),
    storyId,
    action: EditorialControlAction.APPROVE_STORY,
  });

  assert.deepEqual(result, {
    ok: false,
    code: 'EDITORIAL_MUTATION_COMMIT_FAILED',
    reasons: ['ATOMIC_MUTATION_AND_AUDIT_COMMIT_FAILED'],
  });
});
