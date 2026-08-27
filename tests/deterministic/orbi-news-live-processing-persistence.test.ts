import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AutonomyLevel,
  ContentCategory,
  RiskLevel,
  SystemMode,
  VerificationConfidence,
} from '../../domain/common/enums';
import { CanonicalStoryStatus, ContentFormat, EditorialTone, type CanonicalStory } from '../../domain/editorial/canonical-story';
import type {
  FirestoreClientLike,
  FirestoreCollectionReferenceLike,
  FirestoreDocumentReferenceLike,
  FirestoreDocumentSnapshotLike,
  FirestoreQuerySnapshotLike,
  FirestoreTransactionLike,
} from '../../server/editorial/firestore-persistence';
import { assessControlledActivationProfile, ControlledActivationProfile } from '../../server/operations/controlled-activation-profile';
import { createFirestoreLiveProcessingStore } from '../../server/news/firestore-live-processing-store';
import { createFirestoreLiveEditorialSink } from '../../server/news/firestore-live-editorial-sink';
import { LiveProcessingOutcome } from '../../server/news/live-processing-pipeline';

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

const org = 'orbi' as never;
const now = '2026-08-27T17:00:00.000Z' as never;

test('EDITORIAL_ASSISTED is exact LEVEL_3 and forbids publication automation', () => {
  const runtime = {
    enabled: true,
    organizationId: org,
    workerId: 'vercel-cron',
    systemMode: SystemMode.NORMAL,
    autonomyLevel: AutonomyLevel.LEVEL_3,
    leaseDurationSeconds: 300,
    maxAttempts: 3,
    firestore: { enabled: true, projectId: 'test', databaseId: null },
  };
  const base = {
    ORBI_NEWS_ENABLED_TOGGLES: 'AUTO_DISCOVERY,AUTO_VERIFICATION,AUTO_DRAFT',
    ORBI_NEWS_AVAILABLE_CAPABILITIES: 'NEWS_DISCOVERY,WEB_RESEARCH,VERIFICATION,EVENT_INTELLIGENCE,SCORING,EDITORIAL_GENERATION',
  };
  assert.equal(assessControlledActivationProfile({ profile: ControlledActivationProfile.EDITORIAL_ASSISTED, runtime, authorityEnvironment: base }).ready, true);
  const unsafe = assessControlledActivationProfile({
    profile: ControlledActivationProfile.EDITORIAL_ASSISTED,
    runtime,
    authorityEnvironment: { ...base, ORBI_NEWS_ENABLED_TOGGLES: `${base.ORBI_NEWS_ENABLED_TOGGLES},AUTO_PUBLISH_WEB` },
  });
  assert.equal(unsafe.ready, false);
  assert.ok(unsafe.reasons.some((reason) => reason.includes('FORBIDS_TOGGLE_AUTO_PUBLISH_WEB')));
});

test('live processing receipts remove a candidate from the pending queue', async () => {
  const firestore = new FakeFirestore();
  firestore.data.set('orbiNewsOrganizations/orbi/discoveryCandidates/c1', {
    id: 'c1', organizationId: 'orbi', title: 'News', url: 'https://example.com/news', sourceName: 'Example', publishedAt: now, discoveredAt: now,
  });
  const store = createFirestoreLiveProcessingStore({ firestore });
  assert.equal((await store.listPending(org)).length, 1);
  assert.equal(await store.recordReceipt(org, { candidateId: 'c1', outcome: LiveProcessingOutcome.DEFERRED, storyId: null, reasons: ['TEST'], processedAt: now }), true);
  assert.equal((await store.listPending(org)).length, 0);
  assert.equal(await store.recordReceipt(org, { candidateId: 'c1', outcome: LiveProcessingOutcome.DEFERRED, storyId: null, reasons: ['TEST'], processedAt: now }), false);
});

test('live DRAFT_READY story enters existing editorial store as READY_FOR_REVIEW', async () => {
  const firestore = new FakeFirestore();
  const story: CanonicalStory = {
    id: 'story-c1' as never,
    organizationId: org,
    eventId: 'event-c1' as never,
    verificationRecordId: 'verification-c1' as never,
    status: CanonicalStoryStatus.DRAFT_READY,
    headline: 'Noticia verificada',
    dek: 'Resumen original.',
    slug: 'noticia-verificada',
    primaryCategory: ContentCategory.AI,
    secondaryCategories: [],
    tone: EditorialTone.INFORMATIVE,
    format: ContentFormat.NEWS_POST,
    sections: [
      { key: 'SUMMARY', heading: 'Resumen', body: 'Contenido.' },
      { key: 'WHAT_HAPPENED', heading: 'Qué pasó', body: 'Contenido.' },
      { key: 'WHY_IT_MATTERS', heading: 'Por qué importa', body: 'Contenido.' },
      { key: 'PRACTICAL_IMPACT', heading: 'Impacto', body: 'Contenido.' },
      { key: 'ORBI_LENS', heading: 'ORBI', body: 'Contenido.' },
    ],
    sourceRefs: [{ label: 'Official', url: 'https://example.com/news', isPrimary: true }],
    verificationConfidence: VerificationConfidence.VERY_HIGH,
    riskLevel: RiskLevel.LOW,
    orbiScore: 90,
    socialScore: null,
    shortScore: null,
    canonicalImageAssetId: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
  const sink = createFirestoreLiveEditorialSink({ firestore });
  assert.equal(await sink.persistReadyForReview(story, ['EDITORIAL_GATE_REQUIREMENTS_SATISFIED']), true);
  const persisted = [...firestore.data.values()][0] as any;
  assert.equal(persisted.snapshot.storyStatus, CanonicalStoryStatus.READY_FOR_REVIEW);
  assert.equal(persisted.canonicalStory.status, CanonicalStoryStatus.READY_FOR_REVIEW);
  assert.equal(await sink.persistReadyForReview(story, []), false);
});
