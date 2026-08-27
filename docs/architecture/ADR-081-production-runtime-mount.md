# ADR-081 — Production Autonomous Runtime Mount

## Status
Accepted — NA-11.5 PASS candidate.

## Decision
The ORBI News autonomous runtime is mounted through one server-side composition function only when `ORBI_NEWS_RUNTIME_ENABLED` is explicitly true.

Mounting requires: valid production runtime configuration, scheduler authentication token, explicit production authority snapshot, durable Firestore composition and an injected autonomous operation handler.

The internal route is mounted under `/api/internal/orbi-news-scheduler`.

## Safety properties
- Disabled runtime mounts nothing.
- There is no default autonomous provider handler; a handler must be injected deliberately.
- Missing scheduler authentication fails before route exposure.
- Runtime construction retains Firestore durability requirements from NA-11.1/11.2.
- Authority remains explicit allow-list configuration from NA-11.3.

## Non-goals
NA-11.5 does not wire the mount into `server.ts`, choose external providers, configure Cloud Scheduler, or deploy production infrastructure.
