import test from 'node:test';
import assert from 'node:assert/strict';

import type { OrganizationId, IsoUtcDateTime } from '../../domain/common/types';
import {
  OperationalRunOutcome,
  type OperationalRunRecord,
} from '../../domain/operations/operational-run';
import { OperationalAction, OperationalDecision } from '../../domain/operations/operational-authority';
import { SchedulerDecision, SchedulerJob } from '../../domain/operations/scheduler';
import {
  createFirestoreOperationalRunLedger,
  FIRESTORE_OPERATIONAL_RUNS_COLLECTION,
} from '../../server/operations/firestore-operational-run-ledger';
import { FIRESTORE_OPERATIONS_ROOT_COLLECTION } from '../../server/operations/firestore-execution-lease-persistence';
import type {
  FirestoreClientLike,
  FirestoreCollectionReferenceLike,
  FirestoreDocumentReferenceLike,
  FirestoreDocumentSnapshotLike,
  FirestoreQuerySnapshotLike,
  FirestoreTransactionLike,
} from '../../server/editorial/firestore-persistence';

class Doc implements FirestoreDocumentReferenceLike {
  constructor(readonly path: string, private readonly db: FakeFirestore) {}
  collection(name: string): FirestoreCollectionReferenceLike { return new Col(`${this.path}/${name}`, this.db); }
}
class Col implements FirestoreCollectionReferenceLike {
  constructor(readonly path: string, private readonly db: FakeFirestore) {}
  doc(id: string): FirestoreDocumentReferenceLike { return new Doc(`${this.path}/${id}`, this.db); }
  async get(): Promise<FirestoreQuerySnapshotLike> {
    const prefix = `${this.path}/`;
    return {
      docs: [...this.db.data.entries()]
        .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/'))
        .map(([, value]) => ({ exists: true, data: () => structuredClone(value) })),
    };
  }
}
class Tx implements FirestoreTransactionLike {
  private writes: Array<{ path: string; value: unknown; create: boolean }> = [];
  constructor(private readonly db: FakeFirestore) {}
  async get(ref: FirestoreDocumentReferenceLike): Promise<FirestoreDocumentSnapshotLike> {
    const value = this.db.data.get((ref as Doc).path);
    return { exists: value !== undefined, data: () => structuredClone(value) };
  }
  set(ref: FirestoreDocumentReferenceLike, value: unknown): FirestoreTransactionLike {
    this.writes.push({ path: (ref as Doc).path, value: structuredClone(value), create: false }); return this;
  }
  create(ref: FirestoreDocumentReferenceLike, value: unknown): FirestoreTransactionLike {
    this.writes.push({ path: (ref as Doc).path, value: structuredClone(value), create: true }); return this;
  }
  commit(): void {
    const next = new Map(this.db.data);
    for (const write of this.writes) {
      if (write.create && next.has(write.path)) throw new Error('ALREADY_EXISTS');
      next.set(write.path, write.value);
    }
    this.db.data = next;
  }
}
class FakeFirestore implements FirestoreClientLike {
  data = new Map<string, unknown>();
  collection(name: string): FirestoreCollectionReferenceLike { return new Col(name, this); }
  async runTransaction<T>(op: (tx: FirestoreTransactionLike) => Promise<T>): Promise<T> {
    const tx = new Tx(this); const result = await op(tx); tx.commit(); return result;
  }
}

const org = 'orbi-ecosystem' as OrganizationId;
const run = (overrides: Partial<OperationalRunRecord> = {}): OperationalRunRecord => ({
  runId: 'run-1', organizationId: org, workerId: 'worker-a', tickKey: 'DISCOVERY_RADAR:2026-08-27:00',
  job: SchedulerJob.DISCOVERY_RADAR, action: OperationalAction.DISCOVER_NEWS,
  schedulerDecision: SchedulerDecision.DUE, authorityDecision: OperationalDecision.ALLOW,
  leaseAttempt: 1, startedAt: '2026-08-27T04:00:00.000Z' as IsoUtcDateTime,
  finishedAt: '2026-08-27T04:00:01.000Z' as IsoUtcDateTime, durationMs: 1000,
  outcome: OperationalRunOutcome.COMPLETED, reasons: [], ...overrides,
});
const path = (organization: string, runId: string) =>
  `${FIRESTORE_OPERATIONS_ROOT_COLLECTION}/${organization}/${FIRESTORE_OPERATIONAL_RUNS_COLLECTION}/${runId}`;

test('append persists immutable operational run record', async () => {
  const db = new FakeFirestore(); const ledger = createFirestoreOperationalRunLedger({ firestore: db });
  const record = run(); await ledger.append(record);
  assert.deepEqual(db.data.get(path(org, 'run-1')), record);
});

test('duplicate runId is rejected and original record is preserved', async () => {
  const db = new FakeFirestore(); const ledger = createFirestoreOperationalRunLedger({ firestore: db });
  const original = run(); await ledger.append(original);
  await assert.rejects(ledger.append(run({ workerId: 'worker-b' })), /OPERATIONAL_RUN_ALREADY_EXISTS/);
  assert.deepEqual(db.data.get(path(org, 'run-1')), original);
});

test('listByOrganization isolates organizations', async () => {
  const db = new FakeFirestore(); const ledger = createFirestoreOperationalRunLedger({ firestore: db });
  await ledger.append(run());
  await ledger.append(run({ runId: 'run-2', organizationId: 'other-org' as OrganizationId }));
  const records = await ledger.listByOrganization(org);
  assert.equal(records.length, 1); assert.equal(records[0].runId, 'run-1');
});

test('corrupt persisted record fails closed', async () => {
  const db = new FakeFirestore(); const ledger = createFirestoreOperationalRunLedger({ firestore: db });
  db.data.set(path(org, 'bad-run'), { runId: 'bad-run', organizationId: org });
  await assert.rejects(ledger.listByOrganization(org), /OPERATIONS_FIRESTORE_INVALID_RUN_RECORD/);
});
