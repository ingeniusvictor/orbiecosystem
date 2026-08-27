import test from 'node:test';
import assert from 'node:assert/strict';
import type { FirestoreClientLike, FirestoreCollectionReferenceLike, FirestoreDocumentReferenceLike, FirestoreDocumentSnapshotLike, FirestoreQuerySnapshotLike, FirestoreTransactionLike } from '../../server/editorial/firestore-persistence';
import { createFirestoreDiscoverySink } from '../../server/discovery/firestore-discovery-sink';

class Doc implements FirestoreDocumentReferenceLike {
  constructor(readonly path: string, private db: DB) {}
  collection(name: string): FirestoreCollectionReferenceLike { return new Col(`${this.path}/${name}`, this.db); }
}
class Col implements FirestoreCollectionReferenceLike {
  constructor(readonly path: string, private db: DB) {}
  doc(id: string): FirestoreDocumentReferenceLike { return new Doc(`${this.path}/${id}`, this.db); }
  async get(): Promise<FirestoreQuerySnapshotLike> { return { docs: [] }; }
}
class Tx implements FirestoreTransactionLike {
  writes: Array<[string, unknown]> = [];
  constructor(private db: DB) {}
  async get(ref: FirestoreDocumentReferenceLike): Promise<FirestoreDocumentSnapshotLike> { const v = this.db.data.get((ref as Doc).path); return { exists: v !== undefined, data: () => v }; }
  set(ref: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike { this.writes.push([(ref as Doc).path, data]); return this; }
  create(ref: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike { this.writes.push([(ref as Doc).path, data]); return this; }
}
class DB implements FirestoreClientLike {
  data = new Map<string, unknown>();
  collection(name: string): FirestoreCollectionReferenceLike { return new Col(name, this); }
  async runTransaction<T>(fn: (tx: FirestoreTransactionLike) => Promise<T>): Promise<T> { const tx = new Tx(this); const result = await fn(tx); for (const [p, v] of tx.writes) this.data.set(p, v); return result; }
}

const input = {
  context: { organizationId: 'orbi-ecosystem' as any, workerId: 'worker-a', job: 'DISCOVERY_RADAR' as any, action: 'DISCOVER_NEWS' as any, tickKey: 'DISCOVERY_RADAR:2026-08-27:09', nowUtc: '2026-08-27T13:00:00.000Z' as any },
  result: { providerId: 'rss-registry-v1', origin: 'RSS' as any, status: 'AVAILABLE' as any, startedAt: '2026-08-27T13:00:00.000Z' as any, completedAt: '2026-08-27T13:00:01.000Z' as any, warnings: [], candidates: [{ title: 'AI release', url: 'https://example.com/a', sourceName: 'Example', publishedAt: null, origin: 'RSS' as any, discoveredAt: '2026-08-27T13:00:00.000Z' as any }] },
};

test('discovery sink persists exact URL once and replay is idempotent', async () => {
  const db = new DB();
  const sink = createFirestoreDiscoverySink({ firestore: db });
  await sink.persist(input);
  assert.equal(db.data.size, 1);
  const first = [...db.data.values()][0] as any;
  await sink.persist(input);
  assert.equal(db.data.size, 1);
  assert.deepEqual([...db.data.values()][0], first);
  assert.equal(first.providerId, 'rss-registry-v1');
  assert.equal(first.schedulerTickKey, input.context.tickKey);
});
