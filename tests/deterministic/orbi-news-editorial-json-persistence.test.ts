import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type { CanonicalStoryId, IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import { EditorialControlAction, EditorialRole } from '../../domain/editorial/control-center';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { OrbiEditorialBand } from '../../domain/editorial/scoring';
import type { EditorialQueueSource } from '../../domain/editorial/editorial-queue';
import { PublicationStatus } from '../../domain/publications/publication';
import { createEditorialMutationCommandService } from '../../server/editorial/mutation-command-service';
import { createJsonEditorialPersistence } from '../../server/editorial/json-persistence';
import { mountEditorialPrivateApiIfConfigured } from '../../server/editorial/runtime-mount';
import express from 'express';

const organizationId = 'orbi-ecosystem' as OrganizationId;
const storyId = 'story-persisted' as CanonicalStoryId;

const source: EditorialQueueSource = {
  storyId,
  revision: 'rev-initial',
  headline: 'Historia persistente',
  slug: 'historia-persistente',
  category: ContentCategory.AI,
  riskLevel: RiskLevel.LOW,
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  orbiScore: 94,
  updatedAt: '2026-08-26T16:00:00Z' as IsoUtcDateTime,
  snapshot: {
    storyStatus: CanonicalStoryStatus.READY_FOR_REVIEW,
    publicationStatus: PublicationStatus.NOT_SCHEDULED,
    editorialGate: {
      decision: IntegratedEditorialDecision.ALLOW_EDITORIAL,
      editorialBand: OrbiEditorialBand.BREAKING_CANDIDATE,
      reasons: ['EDITORIAL_GATE_REQUIREMENTS_SATISFIED'],
    },
    breakingEligibility: { eligible: true, reasons: [] },
    isBreaking: false,
  },
};

const createStoreFile = async () => {
  const directory = await mkdtemp(join(tmpdir(), 'orbi-editorial-'));
  const filePath = join(directory, 'store.json');
  await writeFile(filePath, JSON.stringify({
    schemaVersion: 1,
    organizations: { [organizationId]: [source] },
    auditLog: [],
  }, null, 2));
  return { directory, filePath };
};

test('json persistence survives adapter recreation and returns organization-scoped queue sources', async () => {
  const { directory, filePath } = await createStoreFile();
  try {
    const first = createJsonEditorialPersistence({ filePath });
    assert.equal((await first.listQueueSources(organizationId))[0].revision, 'rev-initial');

    const second = createJsonEditorialPersistence({ filePath });
    const items = await second.listQueueSources(organizationId);
    assert.equal(items.length, 1);
    assert.equal(items[0].storyId, storyId);
    assert.deepEqual(await second.listQueueSources('other-org' as OrganizationId), []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('successful command persists mutation and audit entry in the same durable file state', async () => {
  const { directory, filePath } = await createStoreFile();
  try {
    const persistence = createJsonEditorialPersistence({ filePath });
    const service = createEditorialMutationCommandService(
      persistence,
      () => '2026-08-26T16:10:00Z' as IsoUtcDateTime,
    );

    const result = await service.execute({
      actor: { organizationId, actorId: 'victor', role: EditorialRole.OWNER },
      storyId,
      action: EditorialControlAction.APPROVE_STORY,
      expectedRevision: 'rev-initial',
      reason: 'Revisión completada',
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.notEqual(result.revision, 'rev-initial');

    const recreated = createJsonEditorialPersistence({ filePath });
    const [persisted] = await recreated.listQueueSources(organizationId);
    assert.equal(persisted.revision, result.revision);
    assert.equal(persisted.snapshot.storyStatus, CanonicalStoryStatus.APPROVED);
    assert.equal(persisted.updatedAt, '2026-08-26T16:10:00Z');

    const audit = await recreated.listAuditEntries(organizationId);
    assert.equal(audit.length, 1);
    assert.equal(audit[0].entityId, storyId);
    assert.equal(audit[0].actor.id, 'victor');

    const raw = JSON.parse(await readFile(filePath, 'utf8')) as { auditLog: unknown[] };
    assert.equal(raw.auditLog.length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('stale expected revision is rejected without mutation or audit append', async () => {
  const { directory, filePath } = await createStoreFile();
  try {
    const persistence = createJsonEditorialPersistence({ filePath });
    const record = await persistence.loadForMutation(organizationId, storyId);
    assert.ok(record);

    const conflict = await persistence.commitMutation({
      organizationId,
      storyId,
      expectedRevision: 'rev-stale',
      patch: { isBreaking: true },
      auditEntry: {
        id: 'audit-conflict' as never,
        organizationId,
        entityType: 'CANONICAL_STORY' as never,
        entityId: storyId,
        action: 'UPDATED' as never,
        actor: { type: 'HUMAN' as never, id: 'victor', displayName: null },
        stateChange: null,
        decisionContext: null,
        errorContext: null,
        correlationId: 'corr',
        metadata: {},
        occurredAt: '2026-08-26T16:11:00Z' as IsoUtcDateTime,
      },
    });

    assert.deepEqual(conflict, { ok: false, code: 'REVISION_CONFLICT' });
    const [persisted] = await persistence.listQueueSources(organizationId);
    assert.equal(persisted.snapshot.isBreaking, false);
    assert.equal((await persistence.listAuditEntries(organizationId)).length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('local editorial persistence is forbidden when runtime is production', () => {
  assert.throws(() => mountEditorialPrivateApiIfConfigured(
    express(),
    {
      ORBI_EDITORIAL_AUTH_SECRET: 'test-secret',
      ORBI_EDITORIAL_LOCAL_STORE_FILE: '/tmp/editorial.json',
      NODE_ENV: 'production',
    },
  ), /EDITORIAL_LOCAL_STORE_FORBIDDEN_IN_PRODUCTION/);
});
