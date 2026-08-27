# ADR-082 — Production Operation Handler Registry

## Status
Accepted — NA-11.6 PASS candidate.

## Decision
Autonomous production actions are dispatched only through an explicit `ProductionHandlerRegistry` keyed by `OperationalAction`.

Missing handlers throw an action-specific `OPERATION_HANDLER_<ACTION>_NOT_CONFIGURED` error. There is no simulated-success fallback.

## Safety properties
- A configured capability does not invent an implementation.
- Unregistered actions fail after operational authority/lease acquisition and are audited as failures by NA-10 runtime contracts.
- Registry inspection can enumerate exactly which production actions have implementations.
- Registry dispatch does not grant editorial, verification, visual or publication authority.

## Non-goals
This ADR does not implement the individual providers themselves or automatically infer capability availability from registered handlers.
