import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ContentCategory,
  RiskLevel,
  SourceCredibilityBand,
  SourceType,
} from '../../domain/common/enums';
import { ContentFormat, EditorialTone } from '../../domain/editorial/canonical-story';
import { EventType } from '../../domain/events/event';
import { NewsOrigin } from '../../domain/news/news-item';
import { ClaimSensitivity } from '../../domain/verification/source-policy';
import type {
  FirestoreClientLike,
  FirestoreCollectionReferenceLike,
  FirestoreDocumentReferenceLike,
  FirestoreDocumentSnapshotLike,
  FirestoreQuerySnapshotLike,
  FirestoreTransactionLike,
} from '../../server/editorial/firestore-persistence';
import { executeVercelLiveProcessingCron } from '../../server/vercel/live-processing-cron-service';

class DocRef implements FirestoreDocumentReferenceLike {
  constructor(readonly path: string, private readonly db: FakeFirestore) {}
  collection(name: string): FirestoreCollectionReferenceLike { return new CollectionRef(`${this.path}/${name}`, this.db); }
}
class CollectionRef implements FirestoreCollectionReferenceLike {
  constructor(readonly path: string, private readonly db: FakeFirestore) {}
  doc(id: string): FirestoreDocumentReferenceLike { return new DocRef(`${this.path}/${id}`, this.db); }
  async get(): Promise<FirestoreQuerySnapshotLike> {
    const prefix = `${this.path}/`;
    return { docs: [...this.db.data.entries()].filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/')).map(([, value]) => ({ exists: true, data: () => structuredClone(value) })) };
  }
}
class Tx implements FirestoreTransactionLike {
  private writes: Array<{ path: string; value: unknown; create: boolean }> = [];
  constructor(private readonly db: FakeFirestore) {}
  async get(reference: FirestoreDocumentReferenceLike): Promise<FirestoreDocumentSnapshotLike> {
    const value = this.db.data.get((reference as DocRef).path);
    return { exists: value !== undefined, data: () => structuredClone(value) };
  }
  set(reference: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike { this.writes.push({ path: (reference as DocRef).path, value: structuredClone(data), create: false }); return this; }
  create(reference: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike { this.writes.push({ path: (reference as DocRef).path, value: structuredClone(data), create: true }); return this; }
  commit() { for (const write of this.writes) { if (write.create && this.db.data.has(write.path)) throw new Error('ALREADY_EXISTS'); this.db.data.set(write.path, write.value); } }
}
class FakeFirestore implements FirestoreClientLike {
  readonly data = new Map<string, unknown>();
  collection(name: string): FirestoreCollectionReferenceLike { return new CollectionRef(name, this); }
  async runTransaction<T>(operation: (transaction: FirestoreTransactionLike) => Promise<T>): Promise<T> { const tx = new Tx(this); const result = await operation(tx); tx.commit(); return result; }
}

const now = '2026-08-27T17:30:00.000Z';
const official = {
  id: 'official-source', organizationId: 'orbi', name: 'Official Vendor', domain: 'official.example',
  homepageUrl: 'https://official.example/', feedUrl: 'https://official.example/rss', sourceType: SourceType.OFFICIAL,
  credibilityBand: SourceCredibilityBand.AUTHORITATIVE, allowedOrigins: [NewsOrigin.RSS], categories: [ContentCategory.AI],
  status: 'ACTIVE', isPrimaryPreferred: true, notes: null, createdAt: now, updatedAt: now,
};
const media = {
  id: 'media-source', organizationId: 'orbi', name: 'Independent Media', domain: 'media.example',
  homepageUrl: 'https://media.example/', feedUrl: 'https://media.example/rss', sourceType: SourceType.PRIMARY_MEDIA,
  credibilityBand: SourceCredibilityBand.HIGH, allowedOrigins: [NewsOrigin.RSS], categories: [ContentCategory.AI],
  status: 'ACTIVE', isPrimaryPreferred: false, notes: null, createdAt: now, updatedAt: now,
};

const environment = () => ({
  NODE_ENV: 'production',
  ORBI_NEWS_ACTIVATION_PROFILE: 'WEB_AUTONOMOUS',
  ORBI_NEWS_RUNTIME_ENABLED: 'true',
  ORBI_NEWS_ORGANIZATION_ID: 'orbi',
  ORBI_NEWS_WORKER_ID: 'vercel-cron',
  ORBI_NEWS_SYSTEM_MODE: 'NORMAL',
  ORBI_NEWS_AUTONOMY_LEVEL: 'LEVEL_5',
  ORBI_EDITORIAL_FIRESTORE_ENABLED: 'true',
  ORBI_EDITORIAL_FIRESTORE_PROJECT_ID: 'orbi-prod',
  ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY,AUTO_VERIFICATION,AUTO_DRAFT,AUTO_PUBLISH_WEB',
  ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY,WEB_RESEARCH,VERIFICATION,EVENT_INTELLIGENCE,SCORING,EDITORIAL_GENERATION,PUBLIC_NEWS_PORTAL',
  ORBI_NEWS_SOURCE_REGISTRY_JSON: JSON.stringify([official, media]),
  CRON_SECRET: '0123456789abcdef0123456789abcdef',
  GEMINI_API_KEY: 'test-only',
});

const assessment = (riskLevel = RiskLevel.LOW) => ({
  sensitivity: ClaimSensitivity.STANDARD,
  riskLevel,
  riskReasons: [],
  riskNotes: [],
  verificationConfidenceScore: 96,
  claims: [{
    key: 'claim-1',
    statement: 'La empresa confirmó el lanzamiento del nuevo modelo.',
    confidenceScore: 96,
    evidenceUrls: ['https://official.example/news/model', 'https://media.example/news/model'],
  }],
  evidence: [
    { url: 'https://official.example/news/model', stance: 'SUPPORTING' as const, claimSummary: 'Anuncio oficial', publishedAt: now },
    { url: 'https://media.example/news/model', stance: 'SUPPORTING' as const, claimSummary: 'Corroboración independiente', publishedAt: now },
  ],
  contradictionSearchCompleted: true,
  event: {
    eventType: EventType.MODEL_RELEASE,
    primaryEntity: 'Example AI',
    subject: 'Nuevo modelo',
    canonicalSummary: 'Example AI presentó un nuevo modelo.',
    confirmedEventDate: now,
  },
  scoreDimensions: {
    strategicRelevance: 95,
    audienceInterest: 90,
    practicalValue: 90,
    novelty: 90,
    timeliness: 95,
    evidenceStrength: 96,
  },
  proposal: {
    headline: 'Example AI presenta un nuevo modelo',
    dek: 'La compañía confirmó el lanzamiento y una fuente independiente corroboró el anuncio.',
    slug: 'example-ai-presenta-nuevo-modelo',
    primaryCategory: ContentCategory.AI,
    secondaryCategories: [ContentCategory.TECH],
    tone: EditorialTone.INFORMATIVE,
    format: ContentFormat.NEWS_POST,
    sections: ['SUMMARY', 'WHAT_HAPPENED', 'WHY_IT_MATTERS', 'PRACTICAL_IMPACT', 'ORBI_LENS'].map((key) => ({
      key: key as 'SUMMARY',
      heading: key,
      body: 'Texto original ORBI sustentado en el hecho verificado.',
      claimKeys: ['claim-1'],
      sourceKeys: ['official.example', 'media.example'],
    })),
    sourceKeys: ['official.example', 'media.example'],
  },
  groundingValid: true,
  groundingReasons: [],
});

const seedCandidate = (firestore: FakeFirestore, id: string) => {
  firestore.data.set(`orbiNewsOrganizations/orbi/discoveryCandidates/${id}`, {
    id, organizationId: 'orbi', title: 'Nuevo modelo', url: 'https://official.example/news/model',
    sourceName: 'Official Vendor', publishedAt: now, discoveredAt: now,
  });
};

test('WEB_AUTONOMOUS full gate publishes only after grounded verification and deterministic policy', async () => {
  const firestore = new FakeFirestore();
  seedCandidate(firestore, 'candidate-1');
  const result = await executeVercelLiveProcessingCron({
    environment: environment(),
    firestore,
    nowUtc: now as never,
    articleFetcher: { async fetchArticle(url) { return { url, title: 'Nuevo modelo', description: null, text: 'Contenido fuente oficial '.repeat(20) }; } },
    groundedClient: { async research() { return assessment(); } },
  });

  assert.equal(result.processed, 1);
  assert.equal(result.published, 1);
  assert.equal(result.results[0].publicationOutcome, 'PUBLISHED');
  const publicRecord = [...firestore.data.entries()].find(([path]) => path.includes('/publishedArticles/'))?.[1] as any;
  assert.equal(publicRecord.article.slug, 'example-ai-presenta-nuevo-modelo');
  const editorial = [...firestore.data.entries()].find(([path]) => path.includes('orbiEditorialOrganizations/orbi/stories/'))?.[1] as any;
  assert.equal(editorial.snapshot.storyStatus, 'PUBLISHED');
  assert.equal(editorial.snapshot.publicationStatus, 'PUBLISHED');
  assert.ok([...firestore.data.keys()].some((path) => path.includes('/liveProcessingReceipts/candidate-1')));
});

test('non-low-risk story remains in review and is not publicly published', async () => {
  const firestore = new FakeFirestore();
  seedCandidate(firestore, 'candidate-2');
  const result = await executeVercelLiveProcessingCron({
    environment: environment(),
    firestore,
    nowUtc: now as never,
    articleFetcher: { async fetchArticle(url) { return { url, title: 'Nuevo modelo', description: null, text: 'Contenido fuente oficial '.repeat(20) }; } },
    groundedClient: { async research() { return assessment(RiskLevel.MEDIUM); } },
  });

  assert.equal(result.published, 0);
  assert.equal(result.results[0].publicationOutcome, 'REVIEW_REQUIRED');
  assert.equal([...firestore.data.keys()].some((path) => path.includes('/publishedArticles/')), false);
  const editorial = [...firestore.data.entries()].find(([path]) => path.includes('orbiEditorialOrganizations/orbi/stories/'))?.[1] as any;
  assert.equal(editorial.snapshot.storyStatus, 'READY_FOR_REVIEW');
});

test('processing receipt prevents the same candidate from being researched twice', async () => {
  const firestore = new FakeFirestore();
  seedCandidate(firestore, 'candidate-3');
  let researches = 0;
  const input = {
    environment: environment(),
    firestore,
    nowUtc: now as never,
    articleFetcher: { async fetchArticle(url: string) { return { url, title: 'Nuevo modelo', description: null, text: 'Contenido fuente oficial '.repeat(20) }; } },
    groundedClient: { async research() { researches += 1; return assessment(); } },
  };
  await executeVercelLiveProcessingCron(input);
  const replay = await executeVercelLiveProcessingCron(input);
  assert.equal(researches, 1);
  assert.equal(replay.processed, 0);
});
