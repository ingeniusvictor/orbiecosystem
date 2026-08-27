import test from 'node:test';
import assert from 'node:assert/strict';

import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import { ContentCategory } from '../../domain/common/enums';
import type { IsoUtcDateTime } from '../../domain/common/types';
import { PublicationChannel, PublicationStatus, type PublishedNewsSourceRecord } from '../../domain/publications';
import type {
  FirestoreClientLike,
  FirestoreCollectionReferenceLike,
  FirestoreDocumentReferenceLike,
  FirestoreDocumentSnapshotLike,
  FirestoreQuerySnapshotLike,
  FirestoreTransactionLike,
} from '../../server/editorial/firestore-persistence';
import { createFirestorePublicNewsStore } from '../../server/news/firestore-public-news-store';
import { createPublicNewsService } from '../../server/news/public-news-service';
import { authenticateVercelCronAuthorization, resolveVercelCronSecret } from '../../server/vercel/cron-auth';
import { executeDailyNewsDigest } from '../../server/vercel/daily-news-digest';
import { executeVercelDiscoveryCron, runVercelDiscoveryPreflight } from '../../server/vercel/discovery-cron-service';

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
  readonly data = new Map<string, unknown>();
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

const CRON_SECRET = '0123456789abcdef0123456789abcdef';
const source = {
  id: 'source-example', organizationId: 'orbi-ecosystem', name: 'Example Official', domain: 'example.com',
  homepageUrl: 'https://example.com/', feedUrl: 'https://example.com/rss.xml', sourceType: 'OFFICIAL',
  credibilityBand: 'HIGH', allowedOrigins: ['RSS'], categories: ['AI'], status: 'ACTIVE',
  isPrimaryPreferred: true, notes: null, createdAt: '2026-08-27T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z',
};

const discoveryEnvironment = () => ({
  NODE_ENV: 'production', ORBI_NEWS_ACTIVATION_PROFILE: 'DISCOVERY_ONLY', ORBI_NEWS_RUNTIME_ENABLED: 'true',
  ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem', ORBI_NEWS_WORKER_ID: 'vercel-cron', ORBI_NEWS_SYSTEM_MODE: 'NORMAL',
  ORBI_NEWS_AUTONOMY_LEVEL: 'LEVEL_1', ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true', ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
  ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY', ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY',
  ORBI_NEWS_SOURCE_REGISTRY_JSON: JSON.stringify([source]), CRON_SECRET,
});

const publishedRecord = (): PublishedNewsSourceRecord => ({
  storyStatus: CanonicalStoryStatus.PUBLISHED,
  publicationStatus: PublicationStatus.PUBLISHED,
  publicationChannel: PublicationChannel.ORBI_WEB,
  article: {
    id: 'article-1', slug: 'noticia-orbi-prueba', headline: 'Noticia ORBI de prueba', dek: 'Resumen verificable de la noticia.',
    category: ContentCategory.AI, publishedAt: '2026-08-27T12:00:00.000Z' as IsoUtcDateTime,
    imageUrl: null, imageAlt: null, isBreaking: false,
    sections: [{ key: 'SUMMARY', heading: 'Resumen', body: 'Contenido publicado.' }],
    sources: [{ label: 'Fuente oficial', url: 'https://example.com/news', isPrimary: true }],
  },
});

test('Vercel cron authentication accepts only the configured Bearer secret', () => {
  const secret = resolveVercelCronSecret({ CRON_SECRET });
  assert.equal(authenticateVercelCronAuthorization(secret, `Bearer ${secret}`), true);
  assert.equal(authenticateVercelCronAuthorization(secret, 'Bearer wrong'), false);
  assert.equal(authenticateVercelCronAuthorization(secret, undefined), false);
});

test('Vercel discovery preflight no longer depends on Cloud Scheduler transport token', () => {
  const result = runVercelDiscoveryPreflight(discoveryEnvironment());
  assert.equal(result.ready, true);
  assert.deepEqual(result.reasons, []);
});

test('Vercel discovery cron reuses autonomous runtime and persists RSS candidate', async () => {
  const firestore = new FakeFirestore();
  const rssXml = '<rss><channel><title>Example</title><item><title>Fresh AI news</title><link>https://example.com/news/1</link><pubDate>Thu, 27 Aug 2026 12:45:00 GMT</pubDate></item></channel></rss>';
  const result = await executeVercelDiscoveryCron({
    environment: discoveryEnvironment(),
    firestore,
    nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime,
    rss: { fetchImpl: async () => new Response(rssXml, { status: 200, headers: { 'content-type': 'application/rss+xml' } }) },
  });
  assert.equal(result.execution.outcome, 'COMPLETED');
  assert.ok([...firestore.data.keys()].some((path) => path.includes('/discoveryCandidates/')));
  assert.ok([...firestore.data.keys()].some((path) => path.includes('/operationalRuns/')));
});

test('Firestore public news store feeds only published ORBI_WEB records through public service', async () => {
  const firestore = new FakeFirestore();
  const store = createFirestorePublicNewsStore({ firestore, organizationId: 'orbi-ecosystem' as any });
  await store.publish(publishedRecord());
  await store.publish(publishedRecord());
  const feed = await createPublicNewsService(store).listLatest();
  assert.equal(feed.items.length, 1);
  assert.equal(feed.items[0].slug, 'noticia-orbi-prueba');
});

test('daily digest sends once at 09:00 Santiago and is idempotent by editorial date', async () => {
  const firestore = new FakeFirestore();
  const store = createFirestorePublicNewsStore({ firestore, organizationId: 'orbi-ecosystem' as any });
  await store.publish(publishedRecord());
  let sends = 0;
  const environment = {
    ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true', ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
    ORBI_NEWS_ORGANIZATION_ID: 'orbi-ecosystem', ORBI_PUBLIC_BASE_URL: 'https://orbi.example/',
    RESEND_API_KEY: 'test-key', ORBI_NEWS_EMAIL_FROM: 'ORBI News <news@orbi.example>', ORBI_NEWS_DIGEST_RECIPIENT: 'owner@example.com',
  };
  const mailProvider = { async send() { sends += 1; return { id: 'email-1' }; } };
  const first = await executeDailyNewsDigest({ environment, firestore, mailProvider, nowUtc: '2026-08-27T13:00:00.000Z' as IsoUtcDateTime });
  const second = await executeDailyNewsDigest({ environment, firestore, mailProvider, nowUtc: '2026-08-27T13:05:00.000Z' as IsoUtcDateTime });
  assert.equal(first.outcome, 'SENT');
  assert.equal(first.articleCount, 1);
  assert.equal(second.outcome, 'ALREADY_SENT');
  assert.equal(sends, 1);
});

test('daily digest cron window is resolved in America/Santiago instead of fixed UTC', async () => {
  const result = await executeDailyNewsDigest({
    environment: {} as any,
    firestore: new FakeFirestore(),
    mailProvider: { async send() { throw new Error('SHOULD_NOT_SEND'); } },
    nowUtc: '2026-08-27T12:00:00.000Z' as IsoUtcDateTime,
  });
  assert.equal(result.outcome, 'SKIPPED_OUTSIDE_WINDOW');
});
