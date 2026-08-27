# ADR-074 — Health-Constrained Autonomy Gate

## Status
Accepted — NA-10.10.

## Context
NA-10.9 can classify operational health and recommend an autonomy ceiling, but recommendation alone does not affect NA-10.1 authority. A deterministic composition is required so degraded or critical health can reduce the autonomy used for operational authority evaluation without granting new authority.

## Decision
Introduce a pure health-constrained authority gate.

The effective autonomy is:

`min(configuredAutonomyLevel, recommendedAutonomyCeiling)`

When health is HEALTHY the ceiling is null and configured autonomy is preserved exactly.

Default V1 health ceilings remain owned by NA-10.9:
- DEGRADED → LEVEL_3
- CRITICAL → LEVEL_1

The resulting effective autonomy is injected into the existing NA-10.1 `assessOperationalAuthority()` snapshot. All other NA-10.1 rules remain authoritative, including SystemMode, kill switches, toggles, capabilities, daily budgets and retry budgets.

## Consequences
- Operational health can reduce autonomous capability.
- Operational health can never increase configured autonomy.
- HEALTHY does not promote autonomy.
- DEGRADED blocks operations requiring LEVEL_4/LEVEL_5 while retaining eligible LEVEL_1–LEVEL_3 operations when all other authority rules pass.
- CRITICAL limits autonomous attempts to LEVEL_1-class operations.
- A health ceiling is not publication authority and does not bypass downstream editorial, visual, social or publication gates.
- Health reasons are retained as observability context and are not treated as substitutes for NA-10.1 authority reasons.
