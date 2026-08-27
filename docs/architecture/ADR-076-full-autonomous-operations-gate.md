# ADR-076 — Full Autonomous Operations Gate

## Status
Accepted for NA-10.12.

## Context
NA-10.1 through NA-10.11 established operational authority, deterministic scheduling, execution leases, durable lease persistence, orchestration, run audit, durable run ledger, metrics, health policy, health-constrained autonomy and full runtime composition.

The final NA-10 gate must prove the combined system fails closed across the principal autonomous-operation risk boundaries.

## Decision
NA-10 is considered complete only when the deterministic full gate proves all of the following using the real autonomous runtime and orchestrator composition:

1. A healthy due operation can execute exactly once, complete its lease and append its operational audit record.
2. A global kill switch blocks before lease acquisition and handler execution while still producing an audit record.
3. CRITICAL health caps configured LEVEL_5 autonomy to LEVEL_1 before operational authority evaluation and prevents higher-autonomy actions.
4. A completed durable tick is reconstructed from the append-only ledger and cannot execute again.
5. An active lease owned by another worker prevents concurrent execution.
6. Exhausted execution retry attempts prevent the handler from running.
7. Operational ALLOW cannot bypass downstream editorial/publication gates; a downstream rejection fails the lease and is audited.
8. Breaking eligibility bypasses only digest timing. It never bypasses operational toggles or other authority gates.

## Authority boundary
A passing autonomous operations gate does not grant content or publication authority. Scheduler due-ness, operational ALLOW, lease ownership and handler completion remain separate from verification, editorial, visual, social and publication authority.

## Failure semantics
- Policy blocks/deferments occur before lease acquisition.
- Lease contention and retry exhaustion fail closed before handler execution.
- Handler failures after lease acquisition transition the lease to FAILED when possible and persist the failure reason in the operational run ledger.
- Durable completed ticks are terminal for the same scheduler slot.

## Consequences
NA-10 may be marked CLOSED / PASS once TypeScript validation and the complete deterministic test suite pass with the full gate included.

This ADR does not deploy Cloud Scheduler, Cloud Run jobs, external provider calls, automatic Facebook/Instagram publication or a production runtime schedule.
