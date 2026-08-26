import test from 'node:test';
import assert from 'node:assert/strict';

import { AuditAction, AuditActorType, AuditEntityType, type AuditLogEntry } from '../../domain/audit/audit';
import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type { AuditLogId, CanonicalStoryId, IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { OrbiEditorialBand } from '../../domain/editorial/scoring';
import type { EditorialQueueSource } from '../../domain/editorial/editorial-queue';
import { PublicationStatus } from '../../domain/publications/publication';
import {
  FIRESTORE_EDITORIAL_AUDIT_COLLECTION,
  FIRESTORE_EDITORIAL_ROOT_COLLECTION,
  FIRESTORE_EDITORIAL_STORIES_COLLECTION,
  createFirestoreEditorialPersistence,
  type FirestoreClientLike,
  type FirestoreCollectionReferenceLike,
  type FirestoreDocumentReferenceLike,
  type FirestoreDocumentSnapshotLike,
  type FirestoreQuerySnapshotLike,
  type FirestoreTransactionLike,
} from '../../server/editorial/firestore-persistence';

const organizationId = 'orbi-ecosystem' as OrganizationId;
const storyId = 'story-1' as CanonicalStoryId;

const source = (): EditorialQueueSource => ({
  storyId,
  revision: 'rev-1',
  headline: 'Firestore transactional story',
  slug: 'firestore-transactional-story',
  category: ContentCategory.AI,
  riskLevel: RiskLevel.LOW,
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  orbiScore: 94,
  updatedAt: '2026-08-26T16:00:00Z' as IsoUtcDateTime,
  snapshot: {
    storyStatus: CanonicalStoryStatus.READY_FOR_REVIEW,
    publicationStatus: PublicationStatus.NOT_SCHEDULED,
    editorialGate: {
      decision: IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW,
      editorialBand: OrbiEditorialBand.BREAKING_CANDIDATE,
      reasons: ['HUMAN_EDITORIAL_REVIEW_REQUIRED'],
    },
    breakingEligibility: { eligible: true, reasons: [] },
    isBreaking: false,
  },
});

const auditEntry = (): AuditLogEntry => ({
  id: 'audit-1' as AuditLogId,
  organizationId,
  entityType: AuditEntityType.CANONICAL_STORY,
  entityId: storyId,
  action: AuditAction.APPROVED,
  actor: { type: AuditActorType.HUMAN, id: 'owner-1', displayName: null },
  stateChange: { fromState: CanonicalStoryStatus.READY_FOR_REVIEW, toState: CanonicalStoryStatus.APPROVED },
  decisionContext: { decision: 'APPROVE_STORY', ruleId: 'EDITORIAL_CONTROL_ACTION_GATE', reason: null },
  errorContext: null,
  correlationId: 'corr-1',
  metadata: {},
  occurredAt: '2026-08-26T16:05:00Z' as IsoUtcDateTime,
});

class FakeDocumentReference implements FirestoreDocumentReferenceLike {
  constructor(readonly path: string, private readonly database: FakeFirestore) {}
  collection(name: string): FirestoreCollectionReferenceLike {
    return new FakeCollectionReference(`${this.path}/${name}`, this.database);
  }
}

class FakeCollectionReference implements FirestoreCollectionReferenceLike {
  constructor(readonly path: string, private readonly database: FakeFirestore) {}
  doc(id: string): FirestoreDocumentReferenceLike {
    return new FakeDocumentReference(`${this.path}/${id}`, this.database);
  }
  async get(): Promise<FirestoreQuerySnapshotLike> {
    const prefix = `${this.path}/`;
    const docs = [...this.database.data.entries()]
      .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
      .map(([, value]) => ({ exists: true, data: () => structuredClone(value) }));
    return { docs };
  }
}

class FakeTransaction implements FirestoreTransactionLike {
  private readonly writes: Array<{ kind: 'set' | 'create'; path: string; value: unknown }> = [];

  constructor(private readonly database: FakeFirestore) {}

  async get(reference: FirestoreDocumentReferenceLike): Promise<FirestoreDocumentSnapshotLike> {
    const path = (reference as FakeDocumentReference).path;
    const value = this.database.data.get(path);
    return { exists: value !== undefined, data: () => structuredClone(value) };
  }

  set(reference: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike {
    this.writes.push({ kind: 'set', path: (reference as FakeDocumentReference).path, value: structuredClone(data) });
    return this;
  }

  create(reference: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike {
    this.writes.push({ kind: 'create', path: (reference as FakeDocumentReference).path, value: structuredClone(data) });
    return this;
  }

  commit(): void {
    const next = new Map(this.database.data);
    for (const write of this.writes) {
      if (write.kind === 'create' && next.has(write.path)) throw new Error('ALREADY_EXISTS');
      next.set(write.path, write.value);
    }
    this.database.data = next;
  }
}

class FakeFirestore implements FirestoreClientLike {
  data = new Map<string, unknown>();
  failBeforeCommit = false;

  collection(name: string): FirestoreCollectionReferenceLike {
    return new FakeCollectionReference(name, this);
  }

  async runTransaction<T>(operation: (transaction: FirestoreTransactionLike) => Promise<T>): Promise<T> {
    const transaction = new FakeTransaction(this);
    const result = await operation(transaction);
    if (this.failBeforeCommit) throw new Error('TRANSACTION_FAILED');
    transaction.commit();
    return result;
  }

  seed(path: string, value: unknown): void {
    this.data.set(path, structuredClone(value));
  }
}

const storyPath = `${FIRESTORE_EDITORIAL_ROOT_COLLECTION}/${organizationId}/${FIRESTORE_EDITORIAL_STORIES_COLLECTION}/${storyId}`;
const auditPath = `${FIRESTORE_EDITORIAL_ROOT_COLLECTION}/${organizationId}/${FIRESTORE_EDITORIAL_AUDIT_COLLECTION}/audit-1`;

test('Firestore persistence reads organization-scoped editorial stories', async () => {
  const firestore = new FakeFirestore();
  firestore.seed(storyPath, source());
  firestore.seed(`${FIRESTORE_EDITORIAL_ROOT_COLLECTION}/other/${FIRESTORE_EDITORIAL_STORIES_COLLECTION}/foreign`, {
    ...source(), storyId: 'foreign', revision: 'rev-x',
  });

  const persistence = createFirestoreEditorialPersistence({ firestore });
  const items = await persistence.listQueueSources(organizationId);
  assert.equal(items.length, 1);
  assert.equal(items[0].storyId, storyId);
  assert.equal(items[0].revision, 'rev-1');
});

test('Firestore persistence commits story mutation and audit in one transaction', async () => {
  const firestore = new FakeFirestore();
  firestore.seed(storyPath, source());
  const persistence = createFirestoreEditorialPersistence({
    firestore,
    revisionFactory: () => 'rev-2',
  });

  const result = await persistence.commitMutation({
    organizationId,
    storyId,
    expectedRevision: 'rev-1',
    patch: { storyStatus: CanonicalStoryStatus.APPROVED },
    auditEntry: auditEntry(),
  });

  assert.deepEqual(result, { ok: true, revision: 'rev-2' });
  const persistedStory = firestore.data.get(storyPath) as EditorialQueueSource;
  assert.equal(persistedStory.revision, 'rev-2');
  assert.equal(persistedStory.snapshot.storyStatus, CanonicalStoryStatus.APPROVED);
  assert.deepEqual(firestore.data.get(auditPath), auditEntry());
});

test('revision conflict writes neither story nor audit', async () => {
  const firestore = new FakeFirestore();
  firestore.seed(storyPath, source());
  const persistence = createFirestoreEditorialPersistence({ firestore, revisionFactory: () => 'rev-2' });

  const result = await persistence.commitMutation({
    organizationId,
    storyId,
    expectedRevision: 'rev-stale',
    patch: { storyStatus: CanonicalStoryStatus.APPROVED },
    auditEntry: auditEntry(),
  });

  assert.deepEqual(result, { ok: false, code: 'REVISION_CONFLICT' });
  assert.equal((firestore.data.get(storyPath) as EditorialQueueSource).revision, 'rev-1');
  assert.equal(firestore.data.has(auditPath), false);
});

test('transaction failure leaves story and audit unchanged', async () => {
  const firestore = new FakeFirestore();
  firestore.seed(storyPath, source());
  firestore.failBeforeCommit = true;
  const persistence = createFirestoreEditorialPersistence({ firestore, revisionFactory: () => 'rev-2' });

  const result = await persistence.commitMutation({
    organizationId,
    storyId,
    expectedRevision: 'rev-1',
    patch: { storyStatus: CanonicalStoryStatus.APPROVED },
    auditEntry: auditEntry(),
  });

  assert.deepEqual(result, { ok: false, code: 'COMMIT_FAILED' });
  assert.equal((firestore.data.get(storyPath) as EditorialQueueSource).revision, 'rev-1');
  assert.equal(firestore.data.has(auditPath), false);
});

test('duplicate audit document causes atomic transaction failure', async () => {
  const firestore = new FakeFirestore();
  firestore.seed(storyPath, source());
  firestore.seed(auditPath, auditEntry());
  const persistence = createFirestoreEditorialPersistence({ firestore, revisionFactory: () => 'rev-2' });

  const result = await persistence.commitMutation({
    organizationId,
    storyId,
    expectedRevision: 'rev-1',
    patch: { storyStatus: CanonicalStoryStatus.APPROVED },
    auditEntry: auditEntry(),
  });

  assert.deepEqual(result, { ok: false, code: 'COMMIT_FAILED' });
  assert.equal((firestore.data.get(storyPath) as EditorialQueueSource).revision, 'rev-1');
});
