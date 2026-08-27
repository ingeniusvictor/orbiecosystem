import { randomUUID } from 'node:crypto';
import type { IsoUtcDateTime, OrganizationId } from '../../domain/common/types';
import {
  ExecutionLeaseStatus,
  claimExecutionLease,
  completeExecutionLease,
  createAvailableExecutionLease,
  failExecutionLease,
  type ExecutionLease,
} from '../../domain/operations/execution-lease';
import type {
  FirestoreClientLike,
  FirestoreDocumentReferenceLike,
} from '../editorial/firestore-persistence';

export const FIRESTORE_OPERATIONS_ROOT_COLLECTION = 'orbiOperationalOrganizations';
export const FIRESTORE_EXECUTION_LEASES_COLLECTION = 'executionLeases';

export interface ClaimDurableExecutionLeaseInput {
  readonly organizationId: OrganizationId;
  readonly tickKey: string;
  readonly workerId: string;
  readonly nowUtc: IsoUtcDateTime;
  readonly leaseDurationSeconds: number;
  readonly maxAttempts: number;
}

export interface CompleteDurableExecutionLeaseInput {
  readonly organizationId: OrganizationId;
  readonly tickKey: string;
  readonly workerId: string;
  readonly completedAt: IsoUtcDateTime;
}

export interface FailDurableExecutionLeaseInput {
  readonly organizationId: OrganizationId;
  readonly tickKey: string;
  readonly workerId: string;
  readonly failedAt: IsoUtcDateTime;
  readonly failureReason: string;
}

export interface DurableExecutionLeasePersistence {
  load(organizationId: OrganizationId, tickKey: string): Promise<ExecutionLease | null>;
  claim(input: ClaimDurableExecutionLeaseInput): Promise<ExecutionLease>;
  complete(input: CompleteDurableExecutionLeaseInput): Promise<ExecutionLease>;
  fail(input: FailDurableExecutionLeaseInput): Promise<ExecutionLease>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isExecutionLease = (value: unknown): value is ExecutionLease => {
  if (!isRecord(value)) return false;
  return typeof value.leaseId === 'string'
    && value.leaseId.trim().length > 0
    && typeof value.tickKey === 'string'
    && value.tickKey.trim().length > 0
    && Object.values(ExecutionLeaseStatus).includes(value.status as ExecutionLeaseStatus)
    && isNullableString(value.ownerId)
    && Number.isInteger(value.attempt)
    && Number(value.attempt) >= 0
    && isNullableString(value.claimedAt)
    && isNullableString(value.expiresAt)
    && isNullableString(value.completedAt)
    && typeof value.updatedAt === 'string'
    && isNullableString(value.failureReason);
};

const required = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label} is required.`);
  return normalized;
};

const organizationDocument = (
  firestore: FirestoreClientLike,
  organizationId: OrganizationId,
): FirestoreDocumentReferenceLike =>
  firestore.collection(FIRESTORE_OPERATIONS_ROOT_COLLECTION).doc(organizationId);

const leaseReference = (
  firestore: FirestoreClientLike,
  organizationId: OrganizationId,
  tickKey: string,
): FirestoreDocumentReferenceLike =>
  organizationDocument(firestore, organizationId)
    .collection(FIRESTORE_EXECUTION_LEASES_COLLECTION)
    .doc(required('Scheduler tick key', tickKey));

const readLease = (value: unknown): ExecutionLease => {
  if (!isExecutionLease(value)) throw new Error('OPERATIONS_FIRESTORE_INVALID_EXECUTION_LEASE');
  return value;
};

export const createFirestoreExecutionLeasePersistence = ({
  firestore,
  leaseIdFactory = () => `lease-${randomUUID()}`,
}: {
  readonly firestore: FirestoreClientLike;
  readonly leaseIdFactory?: () => string;
}): DurableExecutionLeasePersistence => ({
  async load(organizationId, tickKey) {
    const reference = leaseReference(firestore, organizationId, tickKey);
    return firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) return null;
      return readLease(snapshot.data());
    });
  },

  async claim(input) {
    const tickKey = required('Scheduler tick key', input.tickKey);
    const reference = leaseReference(firestore, input.organizationId, tickKey);

    return firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      const existing = snapshot.exists
        ? readLease(snapshot.data())
        : createAvailableExecutionLease({
            leaseId: required('Execution lease id', leaseIdFactory()),
            tickKey,
            createdAt: input.nowUtc,
          });

      if (existing.tickKey !== tickKey) {
        throw new Error('OPERATIONS_FIRESTORE_EXECUTION_LEASE_TICK_MISMATCH');
      }

      const claimed = claimExecutionLease({
        lease: existing,
        workerId: input.workerId,
        nowUtc: input.nowUtc,
        leaseDurationSeconds: input.leaseDurationSeconds,
        maxAttempts: input.maxAttempts,
      });

      if (!snapshot.exists) transaction.create(reference, claimed);
      else if (claimed !== existing) transaction.set(reference, claimed);

      return claimed;
    });
  },

  async complete(input) {
    const tickKey = required('Scheduler tick key', input.tickKey);
    const reference = leaseReference(firestore, input.organizationId, tickKey);

    return firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error('OPERATIONS_FIRESTORE_EXECUTION_LEASE_NOT_FOUND');
      const existing = readLease(snapshot.data());
      if (existing.tickKey !== tickKey) {
        throw new Error('OPERATIONS_FIRESTORE_EXECUTION_LEASE_TICK_MISMATCH');
      }
      const completed = completeExecutionLease({
        lease: existing,
        workerId: input.workerId,
        completedAt: input.completedAt,
      });
      transaction.set(reference, completed);
      return completed;
    });
  },

  async fail(input) {
    const tickKey = required('Scheduler tick key', input.tickKey);
    const reference = leaseReference(firestore, input.organizationId, tickKey);

    return firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (!snapshot.exists) throw new Error('OPERATIONS_FIRESTORE_EXECUTION_LEASE_NOT_FOUND');
      const existing = readLease(snapshot.data());
      if (existing.tickKey !== tickKey) {
        throw new Error('OPERATIONS_FIRESTORE_EXECUTION_LEASE_TICK_MISMATCH');
      }
      const failed = failExecutionLease({
        lease: existing,
        workerId: input.workerId,
        failedAt: input.failedAt,
        failureReason: input.failureReason,
      });
      transaction.set(reference, failed);
      return failed;
    });
  },
});
