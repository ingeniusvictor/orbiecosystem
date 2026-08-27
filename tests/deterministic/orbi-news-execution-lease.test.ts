import assert from 'node:assert/strict';
import test from 'node:test';
import type { IsoUtcDateTime } from '../../domain/common/types';
import {
  ExecutionLeaseStatus,
  claimExecutionLease,
  completeExecutionLease,
  createAvailableExecutionLease,
  failExecutionLease,
  resolveExecutionLeaseStatus,
} from '../../domain/operations/execution-lease';

const at = (value: string) => value as IsoUtcDateTime;

const available = () => createAvailableExecutionLease({
  leaseId: 'lease-discovery-1',
  tickKey: 'DISCOVERY_RADAR:2026-08-26:22',
  createdAt: at('2026-08-27T02:00:00.000Z'),
});

test('available lease can be claimed by one worker', () => {
  const lease = claimExecutionLease({
    lease: available(),
    workerId: 'worker-a',
    nowUtc: at('2026-08-27T02:00:00.000Z'),
    leaseDurationSeconds: 300,
    maxAttempts: 3,
  });

  assert.equal(lease.status, ExecutionLeaseStatus.CLAIMED);
  assert.equal(lease.ownerId, 'worker-a');
  assert.equal(lease.attempt, 1);
  assert.equal(lease.expiresAt, '2026-08-27T02:05:00.000Z');
});

test('second worker cannot claim active lease', () => {
  const claimed = claimExecutionLease({ lease: available(), workerId: 'worker-a', nowUtc: at('2026-08-27T02:00:00.000Z'), leaseDurationSeconds: 300, maxAttempts: 3 });
  assert.throws(
    () => claimExecutionLease({ lease: claimed, workerId: 'worker-b', nowUtc: at('2026-08-27T02:01:00.000Z'), leaseDurationSeconds: 300, maxAttempts: 3 }),
    /EXECUTION_LEASE_ALREADY_CLAIMED/,
  );
});

test('same owner reclaim during active lease is idempotent', () => {
  const claimed = claimExecutionLease({ lease: available(), workerId: 'worker-a', nowUtc: at('2026-08-27T02:00:00.000Z'), leaseDurationSeconds: 300, maxAttempts: 3 });
  const replay = claimExecutionLease({ lease: claimed, workerId: 'worker-a', nowUtc: at('2026-08-27T02:01:00.000Z'), leaseDurationSeconds: 300, maxAttempts: 3 });
  assert.equal(replay, claimed);
  assert.equal(replay.attempt, 1);
});

test('expired active lease can be reclaimed by another worker and increments attempt', () => {
  const claimed = claimExecutionLease({ lease: available(), workerId: 'worker-a', nowUtc: at('2026-08-27T02:00:00.000Z'), leaseDurationSeconds: 60, maxAttempts: 3 });
  assert.equal(resolveExecutionLeaseStatus(claimed, at('2026-08-27T02:01:00.000Z')), ExecutionLeaseStatus.EXPIRED);
  const reclaimed = claimExecutionLease({ lease: claimed, workerId: 'worker-b', nowUtc: at('2026-08-27T02:01:00.000Z'), leaseDurationSeconds: 60, maxAttempts: 3 });
  assert.equal(reclaimed.ownerId, 'worker-b');
  assert.equal(reclaimed.attempt, 2);
});

test('only active owner can complete lease and COMPLETED is terminal', () => {
  const claimed = claimExecutionLease({ lease: available(), workerId: 'worker-a', nowUtc: at('2026-08-27T02:00:00.000Z'), leaseDurationSeconds: 300, maxAttempts: 3 });
  assert.throws(
    () => completeExecutionLease({ lease: claimed, workerId: 'worker-b', completedAt: at('2026-08-27T02:02:00.000Z') }),
    /EXECUTION_LEASE_OWNER_MISMATCH/,
  );
  const completed = completeExecutionLease({ lease: claimed, workerId: 'worker-a', completedAt: at('2026-08-27T02:02:00.000Z') });
  assert.equal(completed.status, ExecutionLeaseStatus.COMPLETED);
  assert.equal(completed.completedAt, '2026-08-27T02:02:00.000Z');
  assert.throws(
    () => claimExecutionLease({ lease: completed, workerId: 'worker-a', nowUtc: at('2026-08-27T02:03:00.000Z'), leaseDurationSeconds: 300, maxAttempts: 3 }),
    /EXECUTION_LEASE_COMPLETED_TERMINAL/,
  );
});

test('failed lease is retryable only while attempt budget remains', () => {
  const first = claimExecutionLease({ lease: available(), workerId: 'worker-a', nowUtc: at('2026-08-27T02:00:00.000Z'), leaseDurationSeconds: 300, maxAttempts: 2 });
  const failed = failExecutionLease({ lease: first, workerId: 'worker-a', failedAt: at('2026-08-27T02:01:00.000Z'), failureReason: 'provider timeout' });
  assert.equal(failed.status, ExecutionLeaseStatus.FAILED);

  const second = claimExecutionLease({ lease: failed, workerId: 'worker-b', nowUtc: at('2026-08-27T02:02:00.000Z'), leaseDurationSeconds: 300, maxAttempts: 2 });
  assert.equal(second.attempt, 2);
  const failedAgain = failExecutionLease({ lease: second, workerId: 'worker-b', failedAt: at('2026-08-27T02:03:00.000Z'), failureReason: 'second timeout' });
  assert.throws(
    () => claimExecutionLease({ lease: failedAgain, workerId: 'worker-c', nowUtc: at('2026-08-27T02:04:00.000Z'), leaseDurationSeconds: 300, maxAttempts: 2 }),
    /EXECUTION_LEASE_RETRY_BUDGET_EXHAUSTED/,
  );
});

test('completion after lease expiry is rejected', () => {
  const claimed = claimExecutionLease({ lease: available(), workerId: 'worker-a', nowUtc: at('2026-08-27T02:00:00.000Z'), leaseDurationSeconds: 60, maxAttempts: 3 });
  assert.throws(
    () => completeExecutionLease({ lease: claimed, workerId: 'worker-a', completedAt: at('2026-08-27T02:01:00.000Z') }),
    /EXECUTION_LEASE_NOT_ACTIVE/,
  );
});
