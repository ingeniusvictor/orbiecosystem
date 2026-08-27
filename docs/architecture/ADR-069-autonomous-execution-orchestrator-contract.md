# ADR-069 — Autonomous Execution Orchestrator Contract

## Status
Accepted for NA-10.5.

## Context
NA-10.1 defines whether an autonomous action may be attempted. NA-10.2 defines when scheduler jobs are due. NA-10.3/10.4 provide durable single-owner execution leases. A coordinator is now required to compose those authorities without becoming a new editorial or publication authority.

## Decision
Create a server-side autonomous execution orchestrator with this fixed order:

1. validate SchedulerJob → OperationalAction mapping,
2. evaluate scheduler tick,
3. skip NOT_DUE or DUPLICATE_TICK,
4. evaluate operational authority,
5. stop on BLOCK or DEFER,
6. acquire durable execution lease,
7. invoke an injected operation handler,
8. complete the lease on success,
9. fail the lease when the handler throws.

The orchestrator returns one of:

- SKIPPED
- BLOCKED
- DEFERRED
- COMPLETED
- FAILED

## Canonical V1 job/action mapping

- DISCOVERY_RADAR → DISCOVER_NEWS
- SOCIAL_DIGEST → PREPARE_SOCIAL
- BREAKING_SOCIAL → PREPARE_SOCIAL

A mismatched job/action pair fails closed with `AUTONOMOUS_JOB_ACTION_MISMATCH`.

## Authority boundary
The orchestrator coordinates execution only. It does not replace or infer:

- discovery source policy,
- verification authority,
- event resolution,
- editorial gate,
- visual gate,
- publication state machine,
- social readiness,
- human review requirements.

The injected handler remains responsible for invoking those downstream authorities relevant to its operation.

`DUE` does not mean `ALLOW`. `ALLOW` does not mean publication authority. A durable lease does not mean content approval.

## Failure handling
A handler exception after lease acquisition causes the orchestrator to request durable `FAILED` state with a bounded failure reason. If failure persistence itself fails, the result remains `FAILED` and includes `AUTONOMOUS_EXECUTION_FAILURE_PERSISTENCE_FAILED`.

No infinite retries are introduced. Retry ownership remains governed by the durable lease retry budget.

## Breaking rule
`DUE_BREAKING` bypasses only the social digest time window. Operational authority and all downstream gates remain mandatory.

## Consequences
- The scheduler cannot execute handlers directly.
- Kill switches and SystemMode are evaluated before lease acquisition.
- No operational lease is consumed for NOT_DUE, BLOCKED, or DEFERRED work.
- Multiple runtime handlers can be introduced later without weakening the authority chain.
