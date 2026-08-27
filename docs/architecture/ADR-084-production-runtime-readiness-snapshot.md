# ADR-084 — Production Runtime Readiness Snapshot

## Status
Accepted — NA-11.8 PASS candidate.

## Decision
Production readiness is computed as observability over the explicit runtime configuration, authority snapshot and configured production handlers.

Statuses: `DISABLED`, `SAFE_IDLE`, `PARTIAL`, `READY`, `DEGRADED`.

Each configured action is evaluated through the existing NA-10.1 operational authority function. The snapshot reports allowed, deferred and blocked actions plus reasons.

## Safety properties
- Readiness never grants authority or mutates configuration.
- No configured handlers or no allowed handlers produces `SAFE_IDLE`, not false readiness.
- Any configured action blocked by kill switch/system policy produces `DEGRADED`.
- Mixed allowed/deferred implementations produce `PARTIAL`.
- `READY` means only all configured handlers are operationally attemptable; downstream editorial/publication gates remain mandatory.
