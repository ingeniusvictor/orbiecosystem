# ADR-018 — Verification Failure Handling

Status: Accepted for NA-03.9.

## Decision

Technical failures must never be interpreted as factual verification success. Verification provider failures are represented explicitly and resolved by deterministic policy.

## Failure classes

- `NOT_CONFIGURED`
- `PROVIDER_UNAVAILABLE`
- `TIMEOUT`
- `RATE_LIMITED`
- `INVALID_RESPONSE`
- `PARTIAL_FAILURE`
- `UNKNOWN`

## Retry policy

Retries are finite. The default V1 policy allows at most 3 attempts per verification operation and defines a timeout budget per attempt. Application/infrastructure adapters may execute the retry timing, but they may not exceed the domain maximum without an explicit policy change.

A retryable failure before `maxAttempts` produces `RETRY`. Reaching the maximum stops autonomous retry.

## Fail-safe outcomes

- Provider not configured -> `DEFER`.
- Temporary retryable failure before maximum -> `DEFER` while retry is eligible.
- Retries exhausted without usable evidence -> `DEFER`.
- Partial/failed research with usable evidence -> `REQUIRE_HUMAN_REVIEW`.
- No technical failure path may yield `ALLOW_EDITORIAL_PIPELINE`.

## Capability status

- `NOT_CONFIGURED` -> `CapabilityStatus.NOT_CONFIGURED`
- partial failure -> `CapabilityStatus.DEGRADED`
- timeout/unavailable/rate-limit/invalid response/unknown -> `CapabilityStatus.UNAVAILABLE`

## Safety invariant

`provider failure != unverified fact != verified fact`.

A technical outage can prevent ORBI from establishing truth, but can never be used as evidence that a claim is true or false.

## Audit

Failure code, provider identifier, attempt number, retry eligibility, final disposition, and structured reason codes should be recorded in the audit trail. Secrets, raw authorization headers, API keys, tokens and sensitive provider payloads must not be stored in audit metadata.
