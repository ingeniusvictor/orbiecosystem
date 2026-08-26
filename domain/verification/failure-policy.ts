import { CapabilityStatus } from '../common/enums';
import { VerificationDecision, type VerificationGateResult } from './verification';

export enum VerificationFailureCode {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  PARTIAL_FAILURE = 'PARTIAL_FAILURE',
  UNKNOWN = 'UNKNOWN',
}

export enum VerificationFailureDisposition {
  RETRY = 'RETRY',
  DEFER = 'DEFER',
  REQUIRE_HUMAN_REVIEW = 'REQUIRE_HUMAN_REVIEW',
  FAIL = 'FAIL',
}

export interface VerificationFailure {
  readonly code: VerificationFailureCode;
  readonly providerId: string | null;
  readonly message: string;
  readonly retryable: boolean;
}

export interface VerificationRetryPolicy {
  readonly maxAttempts: number;
  readonly timeoutMs: number;
}

export interface VerificationFailureContext {
  readonly failure: VerificationFailure;
  readonly attempt: number;
  readonly policy: VerificationRetryPolicy;
  readonly hasUsableEvidence: boolean;
}

export interface VerificationFailureAssessment {
  readonly disposition: VerificationFailureDisposition;
  readonly nextAttempt: number | null;
  readonly reasons: readonly string[];
}

export const DEFAULT_VERIFICATION_RETRY_POLICY: VerificationRetryPolicy = {
  maxAttempts: 3,
  timeoutMs: 10_000,
};

export const capabilityStatusForVerificationFailure = (
  failure: VerificationFailure,
): CapabilityStatus => {
  if (failure.code === VerificationFailureCode.NOT_CONFIGURED) {
    return CapabilityStatus.NOT_CONFIGURED;
  }
  if (failure.code === VerificationFailureCode.PARTIAL_FAILURE) {
    return CapabilityStatus.DEGRADED;
  }
  return CapabilityStatus.UNAVAILABLE;
};

export const assessVerificationFailure = (
  context: VerificationFailureContext,
): VerificationFailureAssessment => {
  const { failure, attempt, policy, hasUsableEvidence } = context;

  if (policy.maxAttempts < 1) {
    throw new RangeError('Verification retry policy maxAttempts must be at least 1.');
  }
  if (policy.timeoutMs < 1) {
    throw new RangeError('Verification retry policy timeoutMs must be at least 1.');
  }
  if (attempt < 1) {
    throw new RangeError('Verification attempt must be at least 1.');
  }

  if (failure.code === VerificationFailureCode.NOT_CONFIGURED) {
    return {
      disposition: VerificationFailureDisposition.DEFER,
      nextAttempt: null,
      reasons: ['VERIFICATION_PROVIDER_NOT_CONFIGURED'],
    };
  }

  if (failure.code === VerificationFailureCode.PARTIAL_FAILURE && hasUsableEvidence) {
    return {
      disposition: VerificationFailureDisposition.REQUIRE_HUMAN_REVIEW,
      nextAttempt: null,
      reasons: ['PARTIAL_VERIFICATION_EVIDENCE_REQUIRES_REVIEW'],
    };
  }

  if (failure.retryable && attempt < policy.maxAttempts) {
    return {
      disposition: VerificationFailureDisposition.RETRY,
      nextAttempt: attempt + 1,
      reasons: ['RETRYABLE_VERIFICATION_FAILURE'],
    };
  }

  if (hasUsableEvidence) {
    return {
      disposition: VerificationFailureDisposition.REQUIRE_HUMAN_REVIEW,
      nextAttempt: null,
      reasons: ['VERIFICATION_FAILED_WITH_PARTIAL_EVIDENCE'],
    };
  }

  return {
    disposition: VerificationFailureDisposition.DEFER,
    nextAttempt: null,
    reasons: ['VERIFICATION_FAILED_WITHOUT_SUFFICIENT_EVIDENCE'],
  };
};

export const verificationGateFromFailureAssessment = (
  assessment: VerificationFailureAssessment,
): VerificationGateResult => {
  switch (assessment.disposition) {
    case VerificationFailureDisposition.REQUIRE_HUMAN_REVIEW:
      return {
        decision: VerificationDecision.REQUIRE_HUMAN_REVIEW,
        reasons: assessment.reasons,
      };
    case VerificationFailureDisposition.RETRY:
    case VerificationFailureDisposition.DEFER:
      return {
        decision: VerificationDecision.DEFER,
        reasons: assessment.reasons,
      };
    case VerificationFailureDisposition.FAIL:
      return {
        decision: VerificationDecision.BLOCK,
        reasons: assessment.reasons,
      };
  }
};
