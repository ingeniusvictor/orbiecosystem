# ADR-071 — Durable Operational Run Ledger

## Status
Accepted.

## Context
NA-10.6 defines `OperationalRunRecord` as the immutable observation of an autonomous execution attempt, including skipped, blocked, deferred, completed and failed outcomes. A durable ledger is required so operations can later reconstruct history and derive metrics without mutating prior observations.

## Decision
Persist operational run records in Firestore under:

`orbiOperationalOrganizations/{organizationId}/operationalRuns/{runId}`

The ledger is append-only. `append()` uses a transaction and `transaction.create()` semantics. If the `runId` already exists, the append fails and the existing record remains unchanged.

The ledger is separate from execution leases. Leases coordinate ownership of a scheduler tick; operational run records document what an orchestrator attempt observed and how it ended.

## Invariants
- `runId` identifies one immutable operational observation within an organization.
- Existing run documents are never silently overwritten.
- Reads are organization-scoped.
- Persisted records are validated and malformed documents fail closed.
- Ledger persistence grants no operational, editorial or publication authority.
- No new credentials or provider dependency are introduced; the existing server-side Firestore client is reused.

## Non-goals
- Aggregated dashboards or SLOs.
- Retention/TTL policy.
- Cross-organization queries.
- Alerting.
- Automatic mutation of daily/retry budgets.

These belong to later NA-10 steps.
