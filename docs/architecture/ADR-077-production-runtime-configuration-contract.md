# ADR-077 — Production Runtime Configuration Contract

Status: ACCEPTED

## Context

NA-10 closed the autonomous operations architecture, but production runtime wiring must not infer dangerous authority from missing environment variables. A production process may start before Cloud Scheduler, provider credentials or runtime control-plane state are fully configured.

## Decision

Introduce a server-only production bootstrap contract in `server/operations/production-runtime-config.ts`.

### Safe defaults

If omitted:

- `ORBI_NEWS_RUNTIME_ENABLED` -> `false`
- `ORBI_NEWS_SYSTEM_MODE` -> `MAINTENANCE`
- `ORBI_NEWS_AUTONOMY_LEVEL` -> `LEVEL_0`
- lease duration -> `300` seconds
- max attempts -> `3`

Runtime bootstrap never enables automation toggles or capabilities.

### Enabled runtime identity

When runtime is enabled, both are mandatory:

- `ORBI_NEWS_ORGANIZATION_ID`
- `ORBI_NEWS_WORKER_ID`

### Production persistence

When `NODE_ENV=production` and runtime is enabled:

- Firestore must be explicitly enabled.
- Firestore project ID is mandatory.
- local editorial JSON storage is forbidden.

ADC/IAM remains the credential model; this contract introduces no secrets or credential files.

### Fail-closed parsing

Invalid boolean flags, system modes, autonomy levels, lease durations or retry limits raise deterministic errors rather than being silently coerced.

## Authority boundary

A parsed configuration does not grant operational authority. In particular:

- `enabled=true` does not enable automation toggles.
- configured autonomy does not bypass health constraints.
- Firestore availability does not make other capabilities available.
- configuration does not authorize publication.

## Deferred

This ADR does not deploy Cloud Scheduler, mount a production execution endpoint, configure IAM, select live discovery/web-research providers, send email, or enable autonomous publication. Those are later NA-11 phases.
