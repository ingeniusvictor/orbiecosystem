import test from 'node:test';
import assert from 'node:assert/strict';

import { AutonomyLevel, CapabilityStatus, SystemCapability, SystemMode } from '../../domain/common/enums';
import type { IsoUtcDateTime } from '../../domain/common/types';
import { AutomationToggle, OperationalAction, SchedulerJob, type OperationalAuthoritySnapshot } from '../../domain/operations';
import type {
  FirestoreClientLike,
  FirestoreCollectionReferenceLike,
  FirestoreDocumentReferenceLike,
  FirestoreDocumentSnapshotLike,
  FirestoreQuerySnapshotLike,
  FirestoreTransactionLike,
} from '../../server/editorial/firestore-persistence';
import { createProductionAutonomousRuntime } from '../../server/operations/production-runtime';

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
        .map(([, value]) => ({ data: () => structuredClone(value) })),
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
    this.writes.push({ kind: 'set', path: (reference as FakeDocumentReference).path, value: structuredClone(data) });
    return this;
  }
  create(reference: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike {
    this.writes.push({ kind: 'create', path: (reference as FakeDocumentReference).path, value: structuredClone(data) });
    return this;
  }
  commit(): void {
    for (const write of this.writes) {
      if (write.kind === 'create' && this.database.data.has(write.path)) throw new Error('ALREADY_EXISTS');
      this.database.data.set(write.path, write.value);
    }
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

const authority = (): OperationalAuthoritySnapshot => ({
  systemMode: SystemMode.NORMAL,
  autonomyLevel: AutonomyLevel.LEVEL_1,
  toggles: { [AutomationToggle.AUTO_DISCOVERY]: true },
  activeKillSwitches: [],
  capabilities: { [SystemCapability.NEWS_DISCOVERY]: CapabilityStatus.AVAILABLE },
  dailyBudgets: {},
  retryBudgets: {},
});

test('disabled production runtime returns null and does not require Firestore', () => {
  const runtime = createProductionAutonomousRuntime({
    environment: {},
    handler: async () => undefined,
  });
  assert.equal(runtime, null);
});

test('enabled runtime requires durable Firestore even outside production composition tests', () => {
  assert.throws(() => createProductionAutonomousRuntime({
    environment: {
      ORBI_NEWS_RUNTIME_ENABLED: 'true',
      ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
      ORBI_NEWS_WORKER_ID: 'worker-a',
    },
    handler: async () => undefined,
    firestoreSdkLoader: () => ({ Firestore: undefined }),
  }), /ORBI_NEWS_RUNTIME_FIRESTORE_REQUIRED|EDITORIAL_FIRESTORE/);
});

test('production composition shares one Firestore client across lease and audit ledger', async () => {
  const firestore = new FakeFirestore();
  let handled = 0;
  const runtime = createProductionAutonomousRuntime({
    environment: {
      NODE_ENV: 'production',
      ORBI_NEWS_RUNTIME_ENABLED: 'true',
      ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem',
      ORBI_NEWS_WORKER_ID: 'worker-a',
      ORBI_NEWS_SYSTEM_MODE: 'NORMAL',
      ORBI_NEWS_AUTONOMY_LEVEL: 'LEVEL_1',
      ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
      ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
    },
    firestore,
    handler: async () => { handled += 1; },
    clock: () => '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
    runIdFactory: () => 'run-production-1',
  });

  assert.ok(runtime);
  const result = await runtime.execute({
    job: SchedulerJob.DISCOVERY_RADAR,
    action: OperationalAction.DISCOVER_NEWS,
    nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
    authoritySnapshot: authority(),
  });

  assert.equal(handled, 1);
  assert.equal(result.execution.outcome, 'COMPLETED');
  assert.equal(result.runRecord.runId, 'run-production-1');
  assert.equal(runtime.configuration.organizationId, 'orbi-ecosystem');
  assert.ok([...firestore.data.keys()].some((path) => path.includes('/executionLeases/')));
  assert.ok([...firestore.data.keys()].some((path) => path.endsWith('/operationalRuns/run-production-1')));
});
