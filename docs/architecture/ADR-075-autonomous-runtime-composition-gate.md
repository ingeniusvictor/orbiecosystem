# ADR-075 — Autonomous Runtime Composition Gate

## Status
Accepted — NA-10.11.

## Context
NA-10.1 through NA-10.10 define operational authority, scheduling, durable leases, orchestration, append-only run audit, metrics, health policy, and health-constrained autonomy as separate contracts. Production-safe autonomous behavior requires those contracts to be composed in one deterministic runtime order without allowing observability or health state to become editorial/publication authority.

## Decision
The autonomous runtime executes the following sequence for one organization:

1. Read prior operational runs from the durable ledger.
2. Aggregate the operational health snapshot.
3. Assess health policy at the current UTC instant.
4. Compute effective autonomy as `min(configured autonomy, health ceiling)`.
5. Derive completed scheduler tick keys only from prior `COMPLETED` run records.
6. Invoke the existing observed autonomous orchestrator using the effective autonomy snapshot.
7. The orchestrator evaluates scheduler, operational authority, durable lease and handler using their existing contracts.
8. Build an `OperationalRunRecord` for every scheduler/authority outcome.
9. Append that record to the durable run ledger.

## Authority boundaries
- Historical metrics are observability, not publication authority.
- HEALTHY does not increase configured autonomy.
- DEGRADED/CRITICAL may only constrain the effective autonomy level.
- Scheduler DUE does not authorize execution.
- Operational ALLOW does not authorize editorial/publication state transitions.
- Lease ownership does not authorize publication.
- A completed handler means only that the injected handler completed; downstream domain gates remain mandatory inside that handler.

## Fail-closed behavior
- If durable run history cannot be read, runtime execution stops before scheduler/lease/handler side effects.
- Completed tick keys are reconstructed from the durable ledger, preventing a process-local duplicate view from being authoritative.
- If append-only audit persistence fails after execution, the runtime surfaces the error and does not report the run as durably audited. The completed external/domain side effect cannot be rolled back by this layer; remediation must rely on idempotency and the durable execution lease.

## Non-goals
- No Cloud Scheduler/cron deployment.
- No Pub/Sub runtime wiring.
- No real email or Meta publication integration.
- No automatic elevation of autonomy.
- No replacement of verification, editorial, visual, publication or social gates.

## Consequences
The autonomous runtime now has one testable composition boundary from durable history through health-constrained authority and execution back into the append-only ledger. The remaining NA-10 closure work should verify the full autonomous operations architecture, including negative authority paths and runtime invariants, without expanding into deployment infrastructure.
