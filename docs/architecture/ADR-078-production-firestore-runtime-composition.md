# ADR-078 — Production Firestore Runtime Composition

## Status
Accepted — NA-11.2 PASS candidate.

## Decision
The production autonomous runtime is composed server-side from one durable Firestore client shared by execution leases and the append-only operational run ledger.

`createProductionAutonomousRuntime()` resolves the NA-11.1 configuration, returns `null` when disabled, and otherwise constructs:

1. Firestore client (injected or official server SDK),
2. durable execution lease persistence,
3. durable operational run ledger,
4. autonomous execution orchestrator,
5. observed autonomous runtime.

The composition root injects configured organization, worker identity, lease duration and retry attempt limits into each execution.

## Safety properties
- Runtime construction activates no scheduler transport and calls no external provider.
- Disabled runtime requires no Firestore connection.
- Enabled production composition requires durable Firestore; it never falls back to process memory or a local file.
- The same Firestore client backs lease exclusion and run audit to keep one persistence trust boundary.
- Operational authority snapshots remain explicit execution inputs; construction never enables toggles or capabilities.
- Publication/editorial gates remain downstream handler responsibilities.

## Non-goals
NA-11.2 does not mount an HTTP endpoint, configure Cloud Scheduler, select discovery/email providers, deploy Cloud Run, or enable automatic publication.
