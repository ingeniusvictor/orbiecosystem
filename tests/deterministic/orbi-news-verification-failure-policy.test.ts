import test from 'node:test';
import assert from 'node:assert/strict';

import { CapabilityStatus } from '../../domain/common/enums';
import {
  DEFAULT_VERIFICATION_RETRY_POLICY,
  VerificationFailureCode,
  VerificationFailureDisposition,
  assessVerificationFailure,
  capabilityStatusForVerificationFailure,
  verificationGateFromFailureAssessment,
} from '../../domain/verification/failure-policy';
import { VerificationDecision } from '../../domain/verification/verification';

const timeoutFailure = {
  code: VerificationFailureCode.TIMEOUT,
  providerId: 'research-provider',
  message: 'Timed out',
  retryable: true,
} as const;

test('not configured provider maps to NOT_CONFIGURED and defers without retry', () => {
  const failure = {
    code: VerificationFailureCode.NOT_CONFIGURED,
    providerId: null,
    message: 'Provider missing',
    retryable: false,
  } as const;

  assert.equal(capabilityStatusForVerificationFailure(failure), CapabilityStatus.NOT_CONFIGURED);

  const assessment = assessVerificationFailure({
    failure,
    attempt: 1,
    policy: DEFAULT_VERIFICATION_RETRY_POLICY,
    hasUsableEvidence: false,
  });

  assert.equal(assessment.disposition, VerificationFailureDisposition.DEFER);
  assert.equal(assessment.nextAttempt, null);
  assert.equal(
    verificationGateFromFailureAssessment(assessment).decision,
    VerificationDecision.DEFER,
  );
});

test('retryable timeout retries before reaching the max attempts', () => {
  const assessment = assessVerificationFailure({
    failure: timeoutFailure,
    attempt: 1,
    policy: { maxAttempts: 3, timeoutMs: 5000 },
    hasUsableEvidence: false,
  });

  assert.equal(assessment.disposition, VerificationFailureDisposition.RETRY);
  assert.equal(assessment.nextAttempt, 2);
});

test('retryable timeout stops retrying after max attempts', () => {
  const assessment = assessVerificationFailure({
    failure: timeoutFailure,
    attempt: 3,
    policy: { maxAttempts: 3, timeoutMs: 5000 },
    hasUsableEvidence: false,
  });

  assert.equal(assessment.disposition, VerificationFailureDisposition.DEFER);
  assert.equal(assessment.nextAttempt, null);
});

test('partial failure with usable evidence requires human review', () => {
  const assessment = assessVerificationFailure({
    failure: {
      code: VerificationFailureCode.PARTIAL_FAILURE,
      providerId: 'research-provider',
      message: 'Some sources failed',
      retryable: true,
    },
    attempt: 1,
    policy: DEFAULT_VERIFICATION_RETRY_POLICY,
    hasUsableEvidence: true,
  });

  assert.equal(assessment.disposition, VerificationFailureDisposition.REQUIRE_HUMAN_REVIEW);
  assert.equal(
    verificationGateFromFailureAssessment(assessment).decision,
    VerificationDecision.REQUIRE_HUMAN_REVIEW,
  );
});

test('exhausted retries with usable evidence require human review rather than verification', () => {
  const assessment = assessVerificationFailure({
    failure: timeoutFailure,
    attempt: 3,
    policy: { maxAttempts: 3, timeoutMs: 5000 },
    hasUsableEvidence: true,
  });

  assert.equal(assessment.disposition, VerificationFailureDisposition.REQUIRE_HUMAN_REVIEW);
  assert.notEqual(
    verificationGateFromFailureAssessment(assessment).decision,
    VerificationDecision.ALLOW_EDITORIAL_PIPELINE,
  );
});

test('provider failure maps to UNAVAILABLE while partial failure maps to DEGRADED', () => {
  assert.equal(
    capabilityStatusForVerificationFailure(timeoutFailure),
    CapabilityStatus.UNAVAILABLE,
  );
  assert.equal(
    capabilityStatusForVerificationFailure({
      code: VerificationFailureCode.PARTIAL_FAILURE,
      providerId: 'research-provider',
      message: 'partial',
      retryable: true,
    }),
    CapabilityStatus.DEGRADED,
  );
});

test('invalid retry configuration is rejected deterministically', () => {
  assert.throws(
    () => assessVerificationFailure({
      failure: timeoutFailure,
      attempt: 1,
      policy: { maxAttempts: 0, timeoutMs: 5000 },
      hasUsableEvidence: false,
    }),
    /maxAttempts/,
  );

  assert.throws(
    () => assessVerificationFailure({
      failure: timeoutFailure,
      attempt: 1,
      policy: { maxAttempts: 3, timeoutMs: 0 },
      hasUsableEvidence: false,
    }),
    /timeoutMs/,
  );
});
