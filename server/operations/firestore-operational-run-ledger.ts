import type { OrganizationId } from '../../domain/common/types';
import {
  OperationalRunOutcome,
  type OperationalRunRecord,
} from '../../domain/operations/operational-run';
import { OperationalAction, OperationalDecision } from '../../domain/operations/operational-authority';
import { SchedulerDecision, SchedulerJob } from '../../domain/operations/scheduler';
import type {
  FirestoreClientLike,
  FirestoreDocumentReferenceLike,
} from '../editorial/firestore-persistence';
import { FIRESTORE_OPERATIONS_ROOT_COLLECTION } from './firestore-execution-lease-persistence';

export const FIRESTORE_OPERATIONAL_RUNS_COLLECTION = 'operationalRuns';

export interface OperationalRunLedger {
  append(record: OperationalRunRecord): Promise<void>;
  listByOrganization(organizationId: OrganizationId): Promise<readonly OperationalRunRecord[]>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNullableDecision = (value: unknown): value is OperationalDecision | null =>
  value === null || Object.values(OperationalDecision).includes(value as OperationalDecision);

const isNullablePositiveInteger = (value: unknown): value is number | null =>
  value === null || (Number.isInteger(value) && Number(value) > 0);

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isOperationalRunRecord = (value: unknown): value is OperationalRunRecord => {
  if (!isRecord(value)) return false;
  return typeof value.runId === 'string'
    && value.runId.trim().length > 0
    && typeof value.organizationId === 'string'
    && value.organizationId.trim().length > 0
    && typeof value.workerId === 'string'
    && value.workerId.trim().length > 0
    && typeof value.tickKey === 'string'
    && value.tickKey.trim().length > 0
    && Object.values(SchedulerJob).includes(value.job as SchedulerJob)
    && Object.values(OperationalAction).includes(value.action as OperationalAction)
    && Object.values(SchedulerDecision).includes(value.schedulerDecision as SchedulerDecision)
    && isNullableDecision(value.authorityDecision)
    && isNullablePositiveInteger(value.leaseAttempt)
    && typeof value.startedAt === 'string'
    && typeof value.finishedAt === 'string'
    && Number.isInteger(value.durationMs)
    && Number(value.durationMs) >= 0
    && Object.values(OperationalRunOutcome).includes(value.outcome as OperationalRunOutcome)
    && isStringArray(value.reasons);
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

const runCollection = (
  firestore: FirestoreClientLike,
  organizationId: OrganizationId,
) => organizationDocument(firestore, organizationId).collection(FIRESTORE_OPERATIONAL_RUNS_COLLECTION);

const assertRecordOrganization = (record: OperationalRunRecord): void => {
  required('Operational run id', record.runId);
  required('Operational worker id', record.workerId);
  required('Operational tick key', record.tickKey);
  required('Operational organization id', record.organizationId);
};

export const createFirestoreOperationalRunLedger = ({
  firestore,
}: {
  readonly firestore: FirestoreClientLike;
}): OperationalRunLedger => ({
  async append(record) {
    assertRecordOrganization(record);
    const reference = runCollection(firestore, record.organizationId).doc(record.runId);
    await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (snapshot.exists) throw new Error('OPERATIONAL_RUN_ALREADY_EXISTS');
      transaction.create(reference, record);
    });
  },

  async listByOrganization(organizationId) {
    const snapshot = await runCollection(firestore, organizationId).get();
    return snapshot.docs.map((document) => document.data()).map((value) => {
      if (!isOperationalRunRecord(value)) throw new Error('OPERATIONS_FIRESTORE_INVALID_RUN_RECORD');
      return value;
    });
  },
});
