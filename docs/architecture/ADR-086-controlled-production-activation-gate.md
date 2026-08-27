# ADR-086 — Controlled Production Activation Gate

## Status
Accepted — **NA-12 PASS / CLOSED**.

## Decision
The first real activation profile is `DISCOVERY_ONLY` and is intentionally narrow.

It requires all of the following simultaneously:

- production runtime enabled;
- `SystemMode.NORMAL`;
- `AutonomyLevel.LEVEL_1` exactly;
- Firestore enabled;
- only `AUTO_DISCOVERY` enabled;
- only `NEWS_DISCOVERY` declared available;
- authenticated scheduler token present;
- explicit HTTPS source registry configured;
- at least one active RSS source for the same organization.

Any extra automation toggle or capability invalidates the first activation profile.

The production discovery stack is composed from the existing RSS discovery provider, a bounded HTTPS fetch client, an explicit source registry, a durable Firestore discovery sink, the NA-11 handler registry and the NA-10 autonomous runtime.

Discovery persistence is not verification authority. Exact URL idempotency only prevents identical candidate replay and does not assert semantic event identity or truth.

## Safety boundary
The profile does not enable verification, drafting, image generation, email, web publishing, Facebook publishing or Instagram publishing.

The runtime remains disabled by default. Production deployment, Firestore IAM/ADC, Cloud Run, Cloud Scheduler and actual secret values remain external activation steps and are not performed by this ADR.

## Operational runbook
See `docs/deployment/ORBI-NEWS-CONTROLLED-ACTIVATION.md` and `infra/orbi-news/cloud-scheduler-discovery.template.yaml`.

## Closure evidence
GitHub Actions run `33072551007` completed successfully with:

- dependency installation: PASS;
- TypeScript validation: PASS;
- complete deterministic ORBI News suite: PASS;
- full controlled production activation gate: PASS.

Therefore **NA-12 — Controlled Production Activation is CLOSED / PASS**.
