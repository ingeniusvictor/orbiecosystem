import type { IsoUtcDateTime } from '../common/types';

export enum ExecutionLeaseStatus {
  AVAILABLE = 'AVAILABLE',
  CLAIMED = 'CLAIMED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export interface ExecutionLease {
  readonly leaseId: string;
  readonly tickKey: string;
  readonly status: ExecutionLeaseStatus;
  readonly ownerId: string | null;
  readonly attempt: number;
  readonly claimedAt: IsoUtcDateTime | null;
  readonly expiresAt: IsoUtcDateTime | null;
  readonly completedAt: IsoUtcDateTime | null;
  readonly updatedAt: IsoUtcDateTime;
  readonly failureReason: string | null;
}

export interface ClaimExecutionLeaseInput {
  readonly lease: ExecutionLease;
  readonly workerId: string;
  readonly nowUtc: IsoUtcDateTime;
  readonly leaseDurationSeconds: number;
  readonly maxAttempts: number;
}

const required = (label: string, value: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new RangeError(`${label} is required.`);
  return normalized;
};

const parseInstant = (label: string, value: IsoUtcDateTime): Date => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new RangeError(`${label} is invalid.`);
  return date;
};

const assertPositiveInteger = (label: string, value: number): void => {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${label} must be a positive integer.`);
};

const asIsoUtc = (date: Date): IsoUtcDateTime => date.toISOString() as IsoUtcDateTime;

export const createAvailableExecutionLease = ({
  leaseId,
  tickKey,
  createdAt,
}: {
  readonly leaseId: string;
  readonly tickKey: string;
  readonly createdAt: IsoUtcDateTime;
}): ExecutionLease => ({
  leaseId: required('Execution lease id', leaseId),
  tickKey: required('Scheduler tick key', tickKey),
  status: ExecutionLeaseStatus.AVAILABLE,
  ownerId: null,
  attempt: 0,
  claimedAt: null,
  expiresAt: null,
  completedAt: null,
  updatedAt: createdAt,
  failureReason: null,
});

export const resolveExecutionLeaseStatus = (
  lease: ExecutionLease,
  nowUtc: IsoUtcDateTime,
): ExecutionLeaseStatus => {
  if (lease.status !== ExecutionLeaseStatus.CLAIMED) return lease.status;
  if (lease.expiresAt === null) throw new RangeError('EXECUTION_LEASE_CLAIMED_REQUIRES_EXPIRY');
  const now = parseInstant('Execution lease nowUtc', nowUtc);
  const expires = parseInstant('Execution lease expiresAt', lease.expiresAt);
  return now.getTime() >= expires.getTime() ? ExecutionLeaseStatus.EXPIRED : ExecutionLeaseStatus.CLAIMED;
};

export const claimExecutionLease = (input: ClaimExecutionLeaseInput): ExecutionLease => {
  assertPositiveInteger('Execution lease duration seconds', input.leaseDurationSeconds);
  assertPositiveInteger('Execution max attempts', input.maxAttempts);
  const workerId = required('Execution worker id', input.workerId);
  const now = parseInstant('Execution lease nowUtc', input.nowUtc);
  const resolvedStatus = resolveExecutionLeaseStatus(input.lease, input.nowUtc);

  if (input.lease.status === ExecutionLeaseStatus.COMPLETED) {
    throw new RangeError('EXECUTION_LEASE_COMPLETED_TERMINAL');
  }
  if (resolvedStatus === ExecutionLeaseStatus.CLAIMED) {
    if (input.lease.ownerId === workerId) return input.lease;
    throw new RangeError('EXECUTION_LEASE_ALREADY_CLAIMED');
  }
  if (input.lease.attempt >= input.maxAttempts) {
    throw new RangeError('EXECUTION_LEASE_RETRY_BUDGET_EXHAUSTED');
  }

  const expiresAt = new Date(now.getTime() + input.leaseDurationSeconds * 1000);
  return {
    ...input.lease,
    status: ExecutionLeaseStatus.CLAIMED,
    ownerId: workerId,
    attempt: input.lease.attempt + 1,
    claimedAt: input.nowUtc,
    expiresAt: asIsoUtc(expiresAt),
    completedAt: null,
    updatedAt: input.nowUtc,
    failureReason: null,
  };
};

const assertActiveOwner = (
  lease: ExecutionLease,
  workerId: string,
  nowUtc: IsoUtcDateTime,
): string => {
  const normalizedWorker = required('Execution worker id', workerId);
  if (resolveExecutionLeaseStatus(lease, nowUtc) !== ExecutionLeaseStatus.CLAIMED) {
    throw new RangeError('EXECUTION_LEASE_NOT_ACTIVE');
  }
  if (lease.ownerId !== normalizedWorker) {
    throw new RangeError('EXECUTION_LEASE_OWNER_MISMATCH');
  }
  return normalizedWorker;
};

export const completeExecutionLease = ({
  lease,
  workerId,
  completedAt,
}: {
  readonly lease: ExecutionLease;
  readonly workerId: string;
  readonly completedAt: IsoUtcDateTime;
}): ExecutionLease => {
  assertActiveOwner(lease, workerId, completedAt);
  return {
    ...lease,
    status: ExecutionLeaseStatus.COMPLETED,
    completedAt,
    expiresAt: null,
    updatedAt: completedAt,
    failureReason: null,
  };
};

export const failExecutionLease = ({
  lease,
  workerId,
  failedAt,
  failureReason,
}: {
  readonly lease: ExecutionLease;
  readonly workerId: string;
  readonly failedAt: IsoUtcDateTime;
  readonly failureReason: string;
}): ExecutionLease => {
  assertActiveOwner(lease, workerId, failedAt);
  return {
    ...lease,
    status: ExecutionLeaseStatus.FAILED,
    expiresAt: null,
    completedAt: null,
    updatedAt: failedAt,
    failureReason: required('Execution failure reason', failureReason),
  };
};
