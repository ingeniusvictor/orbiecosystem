# ADR-010 — Publication Idempotency and Manual Social Policy

## Status
Accepted for ORBI News Intelligence V1.

## Context
ORBI News may publish automatically to the ORBI website while Facebook and Instagram remain human-in-the-loop. Publication attempts can be retried by schedulers, workers or operators, so duplicate posts must be prevented deterministically.

## Decision
Every publishable record receives an idempotency identity composed from channel, account, canonical story and publication slot. A matching existing key blocks a second publication attempt.

The domain, not an AI model, decides whether publication may proceed.

### V1 channel authority
- ORBI_WEB may be automatically published when the canonical story is approved and all policy gates pass.
- FACEBOOK and INSTAGRAM are always REQUIRE_REVIEW in V1. Their SocialPackage is delivered to the configured email and the operator posts it manually through Meta Business Suite.
- Manual social posting is tracked separately so the system knows whether the prepared package was eventually posted or skipped.

### Retry policy
Retries are finite. A publication reaching maxRetries is blocked for autonomous execution and requires intervention.

### System overrides
EMERGENCY_STOP and MAINTENANCE block publication. READ_ONLY defers write operations. Channel and global publishing switches have priority over agents and schedulers.

## Consequences
- Repeated cron invocations cannot create duplicate posts for the same publication identity.
- Social automation can be added later without changing the core publication record.
- ORBI retains a complete distinction between automatic web publishing and manually executed social distribution.
