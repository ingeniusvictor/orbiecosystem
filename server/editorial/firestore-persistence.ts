import { randomUUID } from 'node:crypto';
import type { AuditLogEntry } from '../../domain/audit/audit';
import type { CanonicalStoryId, OrganizationId } from '../../domain/common/types';
import type { EditorialQueueSource } from '../../domain/editorial';
import type { EditorialQueueReader } from './control-center-read-service';
import type {
  EditorialMutationCommit,
  EditorialMutationRecord,
  EditorialMutationUnitOfWork,
} from './mutation-command-service';

export const FIRESTORE_EDITORIAL_ROOT_COLLECTION = 'orbiEditorialOrganizations';
export const FIRESTORE_EDITORIAL_STORIES_COLLECTION = 'stories';
export const FIRESTORE_EDITORIAL_AUDIT_COLLECTION = 'audit';

export interface FirestoreDocumentSnapshotLike {
  readonly exists: boolean;
  data(): unknown;
}

export interface FirestoreQuerySnapshotLike {
  readonly docs: readonly FirestoreDocumentSnapshotLike[];
}

export interface FirestoreDocumentReferenceLike {
  collection(name: string): FirestoreCollectionReferenceLike;
}

export interface FirestoreCollectionReferenceLike {
  doc(id: string): FirestoreDocumentReferenceLike;
  get(): Promise<FirestoreQuerySnapshotLike>;
}

export interface FirestoreTransactionLike {
  get(reference: FirestoreDocumentReferenceLike): Promise<FirestoreDocumentSnapshotLike>;
  set(reference: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike;
  create(reference: FirestoreDocumentReferenceLike, data: unknown): FirestoreTransactionLike;
}

export interface FirestoreClientLike {
  collection(name: string): FirestoreCollectionReferenceLike;
  runTransaction<T>(operation: (transaction: FirestoreTransactionLike) => Promise<T>): Promise<T>;
}

export interface FirestoreEditorialPersistence
  extends EditorialQueueReader, EditorialMutationUnitOfWork {
  listAuditEntries(organizationId: OrganizationId): Promise<readonly AuditLogEntry[]>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isQueueSource = (value: unknown): value is EditorialQueueSource =>
  isRecord(value)
  && typeof value.storyId === 'string'
  && typeof value.revision === 'string'
  && value.revision.trim().length > 0
  && typeof value.headline === 'string'
  && typeof value.slug === 'string'
  && typeof value.updatedAt === 'string'
  && isRecord(value.snapshot);

const isAuditEntry = (value: unknown): value is AuditLogEntry =>
  isRecord(value)
  && typeof value.id === 'string'
  && typeof value.organizationId === 'string'
  && typeof value.entityId === 'string'
  && typeof value.action === 'string'
  && typeof value.occurredAt === 'string';

const applyPatch = (
  source: EditorialQueueSource,
  command: EditorialMutationCommit,
  revision: string,
): EditorialQueueSource => ({
  ...source,
  revision,
  updatedAt: command.auditEntry.occurredAt,
  snapshot: {
    ...source.snapshot,
    ...(command.patch.storyStatus ? { storyStatus: command.patch.storyStatus } : {}),
    ...(command.patch.publicationStatus ? { publicationStatus: command.patch.publicationStatus } : {}),
    ...(command.patch.isBreaking !== undefined ? { isBreaking: command.patch.isBreaking } : {}),
  },
});

const organizationDocument = (
  firestore: FirestoreClientLike,
  organizationId: OrganizationId,
): FirestoreDocumentReferenceLike =>
  firestore.collection(FIRESTORE_EDITORIAL_ROOT_COLLECTION).doc(organizationId);

const storyCollection = (
  firestore: FirestoreClientLike,
  organizationId: OrganizationId,
): FirestoreCollectionReferenceLike =>
  organizationDocument(firestore, organizationId).collection(FIRESTORE_EDITORIAL_STORIES_COLLECTION);

const auditCollection = (
  firestore: FirestoreClientLike,
  organizationId: OrganizationId,
): FirestoreCollectionReferenceLike =>
  organizationDocument(firestore, organizationId).collection(FIRESTORE_EDITORIAL_AUDIT_COLLECTION);

export const createFirestoreEditorialPersistence = ({
  firestore,
  revisionFactory = () => `rev-${randomUUID()}`,
}: {
  readonly firestore: FirestoreClientLike;
  readonly revisionFactory?: () => string;
}): FirestoreEditorialPersistence => ({
  async listQueueSources(organizationId) {
    const snapshot = await storyCollection(firestore, organizationId).get();
    return snapshot.docs.map((document) => document.data()).map((value) => {
      if (!isQueueSource(value)) throw new Error('EDITORIAL_FIRESTORE_INVALID_QUEUE_SOURCE');
      return value;
    });
  },

  async loadForMutation(organizationId, storyId): Promise<EditorialMutationRecord | null> {
    const reference = storyCollection(firestore, organizationId).doc(storyId);
    const source = await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) return null;
      const value = snapshot.data();
      if (!isQueueSource(value)) throw new Error('EDITORIAL_FIRESTORE_INVALID_QUEUE_SOURCE');
      return value;
    });

    return source
      ? { storyId: source.storyId, revision: source.revision, snapshot: source.snapshot }
      : null;
  },

  async commitMutation(command) {
    try {
      return await firestore.runTransaction(async (transaction) => {
        const stories = storyCollection(firestore, command.organizationId);
        const storyReference = stories.doc(command.storyId);
        const storySnapshot = await transaction.get(storyReference);
        if (!storySnapshot.exists) return { ok: false as const, code: 'COMMIT_FAILED' as const };

        const source = storySnapshot.data();
        if (!isQueueSource(source)) return { ok: false as const, code: 'COMMIT_FAILED' as const };
        if (source.revision !== command.expectedRevision) {
          return { ok: false as const, code: 'REVISION_CONFLICT' as const };
        }

        const revision = revisionFactory();
        if (!revision.trim() || revision === source.revision) {
          return { ok: false as const, code: 'COMMIT_FAILED' as const };
        }

        const auditReference = auditCollection(firestore, command.organizationId)
          .doc(command.auditEntry.id);

        transaction.set(storyReference, applyPatch(source, command, revision));
        transaction.create(auditReference, command.auditEntry);

        return { ok: true as const, revision };
      });
    } catch {
      return { ok: false as const, code: 'COMMIT_FAILED' as const };
    }
  },

  async listAuditEntries(organizationId) {
    const snapshot = await auditCollection(firestore, organizationId).get();
    return snapshot.docs.map((document) => document.data()).map((value) => {
      if (!isAuditEntry(value)) throw new Error('EDITORIAL_FIRESTORE_INVALID_AUDIT_ENTRY');
      return value;
    });
  },
});
