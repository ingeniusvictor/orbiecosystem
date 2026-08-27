# ADR-083 — Production Discovery Handler Integration

## Status
Accepted — NA-11.7 PASS candidate.

## Decision
`DISCOVER_NEWS` can be implemented by bridging the autonomous operation handler to an explicit `DiscoveryProvider` and `ProductionDiscoverySink`.

The handler checks provider status before discovery, constructs a bounded historical query from the server-owned execution time, and persists the provider result through the injected sink. `NOT_CONFIGURED` and `UNAVAILABLE` statuses fail closed.

## Safety properties
- Provider availability is verified before work.
- Query lookback and maximum candidate count are positive bounded configuration values.
- The provider cannot change organization or execution time.
- A provider result that is no longer AVAILABLE/DEGRADED is rejected.
- Discovery success is not publication authority; downstream verification remains mandatory.

## Non-goals
NA-11.7 does not choose a commercial web-search vendor, seed production source registries, or publish discovered candidates directly.
