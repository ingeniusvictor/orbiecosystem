# ADR-079 — Production Operational Authority Snapshot

## Status
Accepted — NA-11.3 PASS candidate.

## Decision
Production operational authority is resolved from explicit server-side allow-lists for automation toggles, capabilities and kill switches.

Missing toggles are not enabled. Missing capabilities are omitted so NA-10.1 resolves them as `NOT_CONFIGURED`. Unknown enum values fail closed.

The production snapshot inherits `SystemMode` and `AutonomyLevel` from the NA-11.1 runtime configuration and exposes the V1 web publication daily budget (default limit 8, usage explicit).

## Safety properties
- No capability or automation toggle is enabled by runtime construction alone.
- Unknown configuration values are rejected rather than ignored.
- Kill switches remain explicit and preserve NA-10.1 precedence.
- Web publication budget is represented in the same authority snapshot used by NA-10.1.
- This configuration does not grant editorial, factual, visual, state-machine or publication authority.

## Non-goals
This ADR does not persist configuration changes, calculate live publication usage, mount an admin UI, or call any provider.
