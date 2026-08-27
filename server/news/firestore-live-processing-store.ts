import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import {
  FIRESTORE_DISCOVERY_CANDIDATES_COLLECTION,
  FIRESTORE_DISCOVERY_ROOT_COLLECTION,
} from '../discovery/firestore-discovery-sink';
import type { LiveNewsCandidate, LiveProcessingOutcome } from './live-processing-pipeline';

export const FIRESTORE_LIVE_PROCESSING_RECEIPTS_COLLECTION = 'liveProcessingReceipts';

export interface LiveProcessingReceipt {
  readonly candidateId: string;
  readonly outcome: LiveProcessingOutcome;
  readonly storyId: string | null;
  readonly reasons: readonly string[];
  readonly processedAt: IsoUtcDateTime;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parseCandidate = (value: unknown, organizationId: OrganizationId): LiveNewsCandidate => {
  if (!isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.organizationId !== 'string'
    || typeof value.title !== 'string'
    || typeof value.url !== 'string'
    || typeof value.discoveredAt !== 'string') {
    throw new Error('LIVE_PROCESSING_INVALID_DISCOVERY_CANDIDATE');
  }
  if (value.organizationId !== organizationId) throw new Error('LIVE_PROCESSING_CANDIDATE_ORGANIZATION_MISMATCH');
  return {
    id: value.id,
    organizationId,
    title: value.title,
    url: value.url,
    sourceName: typeof value.sourceName === 'string' ? value.sourceName : null,
    publishedAt: typeof value.publishedAt === 'string' ? value.publishedAt as IsoUtcDateTime : null,
    discoveredAt: value.discoveredAt as IsoUtcDateTime,
  };
};

const parseReceiptCandidateId = (value: unknown): string | null =>
  isRecord(value) && typeof value.candidateId === 'string' ? value.candidateId : null;

const organizationDocument = (firestore: FirestoreClientLike, organizationId: OrganizationId) =>
  firestore.collection(FIRESTORE_DISCOVERY_ROOT_COLLECTION).doc(organizationId);

export const createFirestoreLiveProcessingStore = ({ firestore }: { readonly firestore: FirestoreClientLike }) => ({
  async listPending(organizationId: OrganizationId, limit = 3): Promise<readonly LiveNewsCandidate[]> {
    if (!Number.isInteger(limit) || limit <= 0 || limit > 20) throw new RangeError('LIVE_PROCESSING_LIMIT_INVALID');
    const organization = organizationDocument(firestore, organizationId);
    const [candidateSnapshot, receiptSnapshot] = await Promise.all([
      organization.collection(FIRESTORE_DISCOVERY_CANDIDATES_COLLECTION).get(),
      organization.collection(FIRESTORE_LIVE_PROCESSING_RECEIPTS_COLLECTION).get(),
    ]);
    const processed = new Set(
      receiptSnapshot.docs.map((doc) => parseReceiptCandidateId(doc.data())).filter((id): id is string => id !== null),
    );
    return candidateSnapshot.docs
      .map((doc) => parseCandidate(doc.data(), organizationId))
      .filter((candidate) => !processed.has(candidate.id))
      .sort((a, b) => a.discoveredAt.localeCompare(b.discoveredAt))
      .slice(0, limit);
  },

  async recordReceipt(
    organizationId: OrganizationId,
    receipt: LiveProcessingReceipt,
  ): Promise<boolean> {
    const reference = organizationDocument(firestore, organizationId)
      .collection(FIRESTORE_LIVE_PROCESSING_RECEIPTS_COLLECTION)
      .doc(receipt.candidateId);
    return firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists) return false;
      transaction.create(reference, {
        candidateId: receipt.candidateId,
        outcome: receipt.outcome,
        storyId: receipt.storyId,
        reasons: [...receipt.reasons],
        processedAt: receipt.processedAt,
      });
      return true;
    });
  },
});
