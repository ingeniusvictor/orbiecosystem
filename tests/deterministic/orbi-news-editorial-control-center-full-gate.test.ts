import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import express from 'express';

import { AuditAction, type AuditLogEntry } from '../../domain/audit/audit';
import { ContentCategory, RiskLevel, VerificationConfidence } from '../../domain/common/enums';
import type { CanonicalStoryId, IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import {
  CanonicalStoryStatus,
  EditorialControlAction,
  EditorialQueueBucket,
  EditorialRole,
  type EditorialQueueSource,
} from '../../domain/editorial';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { OrbiEditorialBand } from '../../domain/editorial/scoring';
import { PublicationStatus } from '../../domain/publications/publication';
import {
  createHttpEditorialControlCenterRepository,
  EDITORIAL_CSRF_COOKIE,
  EditorialRepositoryError,
} from '../../src/editorial/repository';
import {
  FIRESTORE_EDITORIAL_AUDIT_COLLECTION,
  FIRESTORE_EDITORIAL_ROOT_COLLECTION,
  FIRESTORE_EDITORIAL_STORIES_COLLECTION,
  type FirestoreClientLike,
  type FirestoreCollectionReferenceLike,
  type FirestoreDocumentReferenceLike,
  type FirestoreDocumentSnapshotLike,
  type FirestoreQuerySnapshotLike,
  type FirestoreTransactionLike,
} from '../../server/editorial/firestore-persistence';
import { mountEditorialPrivateApiIfConfigured } from '../../server/editorial/runtime-mount';

const organizationId = 'orbi-ecosystem' as OrganizationId;
const foreignOrganizationId = 'other-organization' as OrganizationId;
const storyId = 'story-full-gate' as CanonicalStoryId;
const foreignStoryId = 'story-foreign' as CanonicalStoryId;

const source = (
  id: CanonicalStoryId = storyId,
  revision = 'rev-1',
): EditorialQueueSource => ({
  storyId: id,
  revision,
  headline: 'ORBI News full editorial gate',
  slug: id === storyId ? 'orbi-news-full-editorial-gate' : 'foreign-editorial-story',
  category: ContentCategory.AI,
  riskLevel: RiskLevel.LOW,
  verificationConfidence: VerificationConfidence.VERY_HIGH,
  orbiScore: 94,
  updatedAt: '2026-08-26T18:00:00Z' as IsoUtcDateTime,
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
    return {
      docs: [...this.database.data.entries()]
        .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
        .map(([, value]) => ({ exists: true, data: () => structuredClone(value) })),
    };
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
    this.writes.push({
      kind: 'set',
      path: (reference as FakeDocumentReference).path,
      value: structuredClone(data),
    });
    return this;
  }

  create(reference: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike {
    this.writes.push({
      kind: 'create',
      path: (reference as FakeDocumentReference).path,
      value: structuredClone(data),
    });
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

  collection(name: string): FirestoreCollectionReferenceLike {
    return new FakeCollectionReference(name, this);
  }

  async runTransaction<T>(operation: (transaction: FirestoreTransactionLike) => Promise<T>): Promise<T> {
    const transaction = new FakeTransaction(this);
    const result = await operation(transaction);
    transaction.commit();
    return result;
  }

  seed(path: string, value: unknown): void {
    this.data.set(path, structuredClone(value));
  }
}

const listen = async (app: express.Express): Promise<{ server: Server; baseUrl: string }> => {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('TEST_SERVER_ADDRESS_UNAVAILABLE');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
};

const close = async (server: Server): Promise<void> =>
  new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));

const extractCookie = (setCookie: string, name: string): string | null => {
  const match = new RegExp(`(?:^|,\\s*)${name}=([^;,]+)`).exec(setCookie);
  return match ? decodeURIComponent(match[1]) : null;
};

const storyPath = (
  org: OrganizationId,
  id: CanonicalStoryId,
): string => `${FIRESTORE_EDITORIAL_ROOT_COLLECTION}/${org}/${FIRESTORE_EDITORIAL_STORIES_COLLECTION}/${id}`;

const auditPrefix = `${FIRESTORE_EDITORIAL_ROOT_COLLECTION}/${organizationId}/${FIRESTORE_EDITORIAL_AUDIT_COLLECTION}/`;

test('NA-08 full gate: session -> organization queue -> authorized action -> CSRF -> Firestore transaction -> audit -> refreshed queue', async () => {
  const firestore = new FakeFirestore();
  firestore.seed(storyPath(organizationId, storyId), source());
  firestore.seed(storyPath(foreignOrganizationId, foreignStoryId), source(foreignStoryId, 'foreign-rev-1'));

  const app = express();
  app.use(express.json());
  const mounted = mountEditorialPrivateApiIfConfigured(app, {
    ORBI_EDITORIAL_AUTH_SECRET: 'editorial-full-gate-signing-secret',
    ORBI_EDITORIAL_BOOTSTRAP_ACCESS_KEY: 'editorial-full-gate-bootstrap-key',
    ORBI_EDITORIAL_BOOTSTRAP_ACTOR_ID: 'owner-1',
    ORBI_EDITORIAL_BOOTSTRAP_ORGANIZATION_ID: organizationId,
    ORBI_EDITORIAL_BOOTSTRAP_ROLE: EditorialRole.OWNER,
    ORBI_EDITORIAL_SESSION_TTL_SECONDS: '3600',
    NODE_ENV: 'test',
  }, { firestore });
  assert.equal(mounted, true);

  const { server, baseUrl } = await listen(app);
  const cookies = new Map<string, string>();

  const fetchImpl: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (cookies.size > 0) {
      headers.set('cookie', [...cookies].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('; '));
    }

    const response = await fetch(`${baseUrl}${String(input)}`, { ...init, headers });
    const setCookie = response.headers.get('set-cookie') ?? '';
    for (const name of ['orbi_editorial_session', EDITORIAL_CSRF_COOKIE]) {
      const value = extractCookie(setCookie, name);
      if (value) cookies.set(name, value);
    }
    return response;
  };

  const repository = createHttpEditorialControlCenterRepository({
    fetchImpl,
    csrfProvider: () => cookies.get(EDITORIAL_CSRF_COOKIE) ?? null,
  });

  try {
    assert.equal(await repository.getSession(), null);

    const session = await repository.login('editorial-full-gate-bootstrap-key');
    assert.deepEqual(session.actor, {
      actorId: 'owner-1',
      organizationId,
      role: EditorialRole.OWNER,
    });
    assert.ok(cookies.get('orbi_editorial_session'));
    assert.ok(cookies.get(EDITORIAL_CSRF_COOKIE));

    const initialQueue = await repository.listQueue();
    assert.equal(initialQueue.length, 1, 'actor must only see its organization');
    assert.equal(initialQueue[0].storyId, storyId);
    assert.equal(initialQueue[0].revision, 'rev-1');
    assert.equal(initialQueue[0].bucket, EditorialQueueBucket.NEEDS_REVIEW);

    const approveAssessment = initialQueue[0].actionAssessments.find(
      (assessment) => assessment.action === EditorialControlAction.APPROVE_STORY,
    );
    assert.deepEqual(approveAssessment, {
      action: EditorialControlAction.APPROVE_STORY,
      allowed: true,
      reasons: [],
    });

    const mutation = await repository.executeAction({
      storyId,
      action: EditorialControlAction.APPROVE_STORY,
      expectedRevision: initialQueue[0].revision,
      reason: 'Full gate human approval',
    });
    assert.equal(mutation.action, EditorialControlAction.APPROVE_STORY);
    assert.equal(mutation.storyId, storyId);
    assert.notEqual(mutation.revision, 'rev-1');

    const persisted = firestore.data.get(storyPath(organizationId, storyId)) as EditorialQueueSource;
    assert.equal(persisted.revision, mutation.revision);
    assert.equal(persisted.snapshot.storyStatus, CanonicalStoryStatus.APPROVED);

    const foreign = firestore.data.get(storyPath(foreignOrganizationId, foreignStoryId)) as EditorialQueueSource;
    assert.equal(foreign.revision, 'foreign-rev-1');
    assert.equal(foreign.snapshot.storyStatus, CanonicalStoryStatus.READY_FOR_REVIEW);

    const auditEntries = [...firestore.data.entries()]
      .filter(([path]) => path.startsWith(auditPrefix))
      .map(([, value]) => value as AuditLogEntry);
    assert.equal(auditEntries.length, 1);
    assert.equal(auditEntries[0].organizationId, organizationId);
    assert.equal(auditEntries[0].entityId, storyId);
    assert.equal(auditEntries[0].action, AuditAction.APPROVED);
    assert.equal(auditEntries[0].actor.id, 'owner-1');
    assert.deepEqual(auditEntries[0].stateChange, {
      fromState: CanonicalStoryStatus.READY_FOR_REVIEW,
      toState: CanonicalStoryStatus.APPROVED,
    });
    assert.equal(auditEntries[0].decisionContext.decision, EditorialControlAction.APPROVE_STORY);
    assert.equal(auditEntries[0].decisionContext.reason, 'Full gate human approval');

    const refreshedQueue = await repository.listQueue(EditorialQueueBucket.APPROVED);
    assert.equal(refreshedQueue.length, 1);
    assert.equal(refreshedQueue[0].storyId, storyId);
    assert.equal(refreshedQueue[0].revision, mutation.revision);
    assert.equal(refreshedQueue[0].bucket, EditorialQueueBucket.APPROVED);

    await assert.rejects(
      repository.executeAction({
        storyId,
        action: EditorialControlAction.APPROVE_STORY,
        expectedRevision: 'rev-1',
      }),
      (error: unknown) =>
        error instanceof EditorialRepositoryError &&
        error.code === 'EDITORIAL_ACTION_CONFLICT' &&
        error.status === 409,
    );

    assert.equal(
      [...firestore.data.keys()].filter((path) => path.startsWith(auditPrefix)).length,
      1,
      'stale retry must not append a second audit record',
    );
  } finally {
    await close(server);
  }
});
