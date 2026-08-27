import { createHash } from 'node:crypto';
import type { FirestoreClientLike } from '../editorial/firestore-persistence';
import type { ProductionDiscoverySink } from '../operations/production-discovery-handler';

export const FIRESTORE_DISCOVERY_ROOT_COLLECTION = 'orbiNewsOrganizations';
export const FIRESTORE_DISCOVERY_CANDIDATES_COLLECTION = 'discoveryCandidates';

const candidateId = (url: string): string => createHash('sha256').update(url.trim()).digest('hex');

/**
 * Persists discovery output without assigning verification/editorial authority.
 * Exact URL replay is idempotent; an existing candidate is left unchanged.
 */
export const createFirestoreDiscoverySink = ({ firestore }: { readonly firestore: FirestoreClientLike }): ProductionDiscoverySink => ({
  async persist({ context, result }) {
    for (const candidate of result.candidates) {
      const id = candidateId(candidate.url);
      const reference = firestore.collection(FIRESTORE_DISCOVERY_ROOT_COLLECTION)
        .doc(context.organizationId)
        .collection(FIRESTORE_DISCOVERY_CANDIDATES_COLLECTION)
        .doc(id);
      await firestore.runTransaction(async (transaction) => {
        const existing = await transaction.get(reference);
        if (existing.exists) return;
        transaction.create(reference, {
          id,
          organizationId: context.organizationId,
          title: candidate.title,
          url: candidate.url,
          sourceName: candidate.sourceName,
          publishedAt: candidate.publishedAt,
          origin: candidate.origin,
          discoveredAt: candidate.discoveredAt,
          providerId: result.providerId,
          providerStatus: result.status,
          schedulerTickKey: context.tickKey,
          persistedAt: context.nowUtc,
        });
      });
    }
  },
});
