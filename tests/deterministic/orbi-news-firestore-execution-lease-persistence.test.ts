import test from 'node:test';
import assert from 'node:assert/strict';

import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import { ExecutionLeaseStatus, type ExecutionLease } from '../../domain/operations/execution-lease';
import {
  FIRESTORE_EXECUTION_LEASES_COLLECTION,
  FIRESTORE_OPERATIONS_ROOT_COLLECTION,
  createFirestoreExecutionLeasePersistence,
} from '../../server/operations/firestore-execution-lease-persistence';
import type {
  FirestoreClientLike,
  FirestoreCollectionReferenceLike,
  FirestoreDocumentReferenceLike,
  FirestoreDocumentSnapshotLike,
  FirestoreQuerySnapshotLike,
  FirestoreTransactionLike,
} from '../../server/editorial/firestore-persistence';

const organizationId = 'orbi-ecosystem' as OrganizationId;
const tickKey = 'DISCOVERY_RADAR:2026-08-26:22';
const now = '2026-08-27T02:00:00.000Z' as IsoUtcDateTime;

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
    return { docs: [] };
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

  collection(name: string): FirestoreCollectionReferenceLike {
    return new FakeCollectionReference(name, this);
  }

  async runTransaction<T>(operation: (transaction: FirestoreTransactionLike) => Promise<T>): Promise<T> {
    const transaction = new FakeTransaction(this);
    const result = await operation(transaction);
    transaction.commit();
    return result;
  }
}

const leasePath = `${FIRESTORE_OPERATIONS_ROOT_COLLECTION}/${organizationId}/${FIRESTORE_EXECUTION_LEASES_COLLECTION}/${tickKey}`;

const createPersistence = (firestore: FakeFirestore) =>
  createFirestoreExecutionLeasePersistence({
    firestore,
    leaseIdFactory: () => 'lease-1',
  });

test('first durable claim creates one organization-scoped lease document keyed by tickKey', async () => {
  const firestore = new FakeFirestore();
  const persistence = createPersistence(firestore);

  const lease = await persistence.claim({
    organizationId,
    tickKey,
    workerId: 'worker-a',
    nowUtc: now,
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  });

  assert.equal(lease.status, ExecutionLeaseStatus.CLAIMED);
  assert.equal(lease.ownerId, 'worker-a');
  assert.equal(lease.attempt, 1);
  assert.deepEqual(firestore.data.get(leasePath), lease);
});

test('second worker cannot claim the same persisted tick while first lease is active', async () => {
  const firestore = new FakeFirestore();
  const persistence = createPersistence(firestore);

  await persistence.claim({ organizationId, tickKey, workerId: 'worker-a', nowUtc: now, leaseDurationSeconds: 300, maxAttempts: 3 });

  await assert.rejects(
    () => persistence.claim({
      organizationId,
      tickKey,
      workerId: 'worker-b',
      nowUtc: '2026-08-27T02:01:00.000Z' as IsoUtcDateTime,
      leaseDurationSeconds: 300,
      maxAttempts: 3,
    }),
    /EXECUTION_LEASE_ALREADY_CLAIMED/,
  );

  const persisted = firestore.data.get(leasePath) as ExecutionLease;
  assert.equal(persisted.ownerId, 'worker-a');
  assert.equal(persisted.attempt, 1);
});

test('same worker replay is idempotent and does not consume another attempt', async () => {
  const firestore = new FakeFirestore();
  const persistence = createPersistence(firestore);

  const first = await persistence.claim({ organizationId, tickKey, workerId: 'worker-a', nowUtc: now, leaseDurationSeconds: 300, maxAttempts: 3 });
  const replay = await persistence.claim({
    organizationId,
    tickKey,
    workerId: 'worker-a',
    nowUtc: '2026-08-27T02:01:00.000Z' as IsoUtcDateTime,
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  });

  assert.deepEqual(replay, first);
  assert.equal(replay.attempt, 1);
});

test('expired persisted lease can be atomically taken over by another worker', async () => {
  const firestore = new FakeFirestore();
  const persistence = createPersistence(firestore);

  await persistence.claim({ organizationId, tickKey, workerId: 'worker-a', nowUtc: now, leaseDurationSeconds: 60, maxAttempts: 3 });
  const recovered = await persistence.claim({
    organizationId,
    tickKey,
    workerId: 'worker-b',
    nowUtc: '2026-08-27T02:01:00.000Z' as IsoUtcDateTime,
    leaseDurationSeconds: 60,
    maxAttempts: 3,
  });

  assert.equal(recovered.ownerId, 'worker-b');
  assert.equal(recovered.attempt, 2);
  assert.equal(recovered.status, ExecutionLeaseStatus.CLAIMED);
});

test('complete persists terminal COMPLETED state and prevents future claims', async () => {
  const firestore = new FakeFirestore();
  const persistence = createPersistence(firestore);

  await persistence.claim({ organizationId, tickKey, workerId: 'worker-a', nowUtc: now, leaseDurationSeconds: 300, maxAttempts: 3 });
  const completed = await persistence.complete({
    organizationId,
    tickKey,
    workerId: 'worker-a',
    completedAt: '2026-08-27T02:02:00.000Z' as IsoUtcDateTime,
  });
  assert.equal(completed.status, ExecutionLeaseStatus.COMPLETED);

  await assert.rejects(
    () => persistence.claim({
      organizationId,
      tickKey,
      workerId: 'worker-b',
      nowUtc: '2026-08-27T02:03:00.000Z' as IsoUtcDateTime,
      leaseDurationSeconds: 300,
      maxAttempts: 3,
    }),
    /EXECUTION_LEASE_COMPLETED_TERMINAL/,
  );
});

test('failed persisted lease can retry until maxAttempts then fails closed', async () => {
  const firestore = new FakeFirestore();
  const persistence = createPersistence(firestore);

  await persistence.claim({ organizationId, tickKey, workerId: 'worker-a', nowUtc: now, leaseDurationSeconds: 300, maxAttempts: 2 });
  await persistence.fail({
    organizationId,
    tickKey,
    workerId: 'worker-a',
    failedAt: '2026-08-27T02:01:00.000Z' as IsoUtcDateTime,
    failureReason: 'provider timeout',
  });
  await persistence.claim({
    organizationId,
    tickKey,
    workerId: 'worker-b',
    nowUtc: '2026-08-27T02:02:00.000Z' as IsoUtcDateTime,
    leaseDurationSeconds: 300,
    maxAttempts: 2,
  });
  await persistence.fail({
    organizationId,
    tickKey,
    workerId: 'worker-b',
    failedAt: '2026-08-27T02:03:00.000Z' as IsoUtcDateTime,
    failureReason: 'second failure',
  });

  await assert.rejects(
    () => persistence.claim({
      organizationId,
      tickKey,
      workerId: 'worker-c',
      nowUtc: '2026-08-27T02:04:00.000Z' as IsoUtcDateTime,
      leaseDurationSeconds: 300,
      maxAttempts: 2,
    }),
    /EXECUTION_LEASE_RETRY_BUDGET_EXHAUSTED/,
  );
});

test('organization scope isolates identical tick keys', async () => {
  const firestore = new FakeFirestore();
  const persistence = createPersistence(firestore);
  const otherOrg = 'other-org' as OrganizationId;

  const first = await persistence.claim({ organizationId, tickKey, workerId: 'worker-a', nowUtc: now, leaseDurationSeconds: 300, maxAttempts: 3 });
  const second = await persistence.claim({ organizationId: otherOrg, tickKey, workerId: 'worker-b', nowUtc: now, leaseDurationSeconds: 300, maxAttempts: 3 });

  assert.equal(first.ownerId, 'worker-a');
  assert.equal(second.ownerId, 'worker-b');
  assert.equal(firestore.data.size, 2);
});

test('invalid persisted lease fails closed instead of being overwritten', async () => {
  const firestore = new FakeFirestore();
  firestore.data.set(leasePath, { tickKey, status: 'CLAIMED' });
  const persistence = createPersistence(firestore);

  await assert.rejects(
    () => persistence.claim({ organizationId, tickKey, workerId: 'worker-a', nowUtc: now, leaseDurationSeconds: 300, maxAttempts: 3 }),
    /OPERATIONS_FIRESTORE_INVALID_EXECUTION_LEASE/,
  );
});
