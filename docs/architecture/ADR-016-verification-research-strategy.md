# ADR-016 — Verification Research Strategy

Status: Accepted V1

## Decision

ORBI News verification research follows a deterministic phased strategy rather than an open-ended search loop.

The canonical phase order is:

1. PRIMARY_SOURCE
2. CORROBORATION
3. CONTRADICTION_CHECK
4. CONTEXT

The order is a policy preference, not a claim that every phase must always execute. Required phases depend on claim sensitivity and current risk.

## Primary-source-first

For HIGH_IMPACT or SENSITIVE claims, and for HIGH/CRITICAL risk, an eligible primary source is required before research can be considered sufficient.

The definition of eligible primary source remains owned by ADR-014 and `source-policy.ts`.

## Corroboration

Corroboration requirements are inherited from deterministic source policy:

- standard low/medium-risk claims may proceed with one solid supporting source;
- high-impact or high-risk claims require at least two independent supporting sources and an eligible primary source;
- sensitive/critical claims additionally require authoritative evidence.

## Contradiction search

For HIGH_IMPACT, SENSITIVE, HIGH-risk and CRITICAL-risk verification, ORBI must explicitly perform a contradiction check before research can stop as sufficient.

If authoritative contradicting evidence is found, research stops with `STOP_CONTRADICTED`. Additional supporting articles cannot average away an authoritative contradiction.

## Bounded research

Research has a finite source budget:

- standard low/medium-risk: up to 4 unique sources;
- high-impact or high-risk: up to 6 unique sources;
- sensitive or critical: up to 8 unique sources.

When the source budget is exhausted without satisfying policy, the research layer stops with `STOP_BUDGET_EXHAUSTED`. It must not loop indefinitely.

## Context phase

Context is optional. It may improve explanation, chronology or practical interpretation, but context does not substitute for primary-source or corroboration requirements.

## Authority boundary

AI or an external research provider may suggest queries, sources and claim relationships. It does not decide when verification is sufficient.

Stopping, continuing, contradiction escalation and research-budget enforcement are deterministic policy decisions.
