# NEWS-ECC-P3 — Evidence-backed Agent / Skill Classification

Status: CLASSIFICATION-ONLY / NO INSTALL

Base: `staging/orbi-news-vercel`

## Goal

Reduce the ORBI News Agent Kit surface to what is useful on most News engineering sessions, while keeping specialized visual/social/autonomy capabilities on-demand.

This phase classifies only. It does not install agents, copy the whole ECC catalog, or enable runtime autonomy.

## Repository evidence

ORBI News is a TypeScript/React/Vite + Express system with:

- external-source discovery;
- source verification and contradiction handling;
- canonical editorial story generation;
- image/visual pipelines;
- Firestore persistence;
- scheduling and execution leases;
- web publication;
- email/social packaging;
- controlled autonomy levels and activation profiles;
- kill switches, retry budgets and daily budgets;
- extensive deterministic tests.

The highest recurring engineering risks are factual integrity, authority separation, TypeScript correctness, security/secrets, and deterministic delivery.

## DAILY agents

| Agent | Why |
|---|---|
| `planner` | changes frequently cross discovery/verification/editorial/publication boundaries |
| `architect` | state machine, runtime, authority and persistence boundaries are architectural |
| `code-reviewer` | large TypeScript/TSX domain/server surface |
| `security-reviewer` | external URLs, provider secrets, Firestore, email/social/publication |
| `tdd-guide` | 521 deterministic News tests are a primary authority surface |
| `doc-updater` | activation/runtime/publication rules require durable documentation |
| `typescript-reviewer` | TypeScript dominates the governed News implementation |

## LIBRARY agents

Load only for matching tasks:

- `react-reviewer`
- `react-build-resolver`
- `build-error-resolver`
- `e2e-runner`
- `performance-optimizer`
- `refactor-cleaner`
- `silent-failure-hunter`
- `mle-reviewer`
- `rag-pipeline-reviewer`
- `harness-optimizer`
- `loop-operator`

`loop-operator` remains LIBRARY even though ORBI News has a product autonomy subsystem. Agent Kit autonomous loops are a separate capability and stay disabled.

## DAILY reference skills

- `architecture-decision-records`
- `coding-standards`
- `contract-first`
- `tdd-workflow`
- `orbi-verification-loop`
- `orbi-security-review`
- `orbi-context-budget`
- `delivery-gate`
- `git-workflow`

## LIBRARY reference skills

- `agent-sort`
- `codebase-onboarding`
- `agent-harness-construction`
- `ai-regression-testing`
- `eval-harness`
- `benchmark`
- `benchmark-methodology`
- `browser-qa`
- `e2e-testing`
- `frontend-patterns`
- `react-patterns`
- `react-testing`
- `react-performance`
- `vite-patterns`
- `error-handling`

## News-specific skills to materialize

The first project skills should be domain-owned, not generic copies:

1. `orbi-news-verification-review`
   - source credibility;
   - contradiction;
   - primary source;
   - risk;
   - confidence;
   - factual grounding;
   - AI-vs-evidence boundary.

2. `orbi-news-publication-authority-review`
   - activation profile;
   - operational ALLOW vs publication permission;
   - web/social/email/image separation;
   - system modes;
   - kill switches;
   - budgets/idempotency/retries;
   - human-review gates.

A later harness can reuse the central kit observation pattern with News-specific authority-impact fields.

## Core invariants

`DISCOVERY != VERIFICATION`

`SOURCE FETCHED != SOURCE TRUSTED`

`MODEL OUTPUT != VERIFIED NEWS FACT`

`OPERATIONAL ALLOW != PUBLICATION AUTHORITY`

`EDITORIAL ALLOW != PUBLICATION PERMISSION`

`WEB_AUTONOMOUS != SOCIAL EMAIL OR IMAGE AUTONOMY`

`CI GREEN != EXTERNAL CHANNEL READINESS`

## Deferred

Still disabled:

- hooks;
- MCP;
- continuous learning;
- unified memory;
- Agent Kit autonomous loops;
- multi-agent runtime roles.

## Next

NEWS-ECC-P4 should materialize `orbi-news-verification-review` from the actual verification/editorial contracts before introducing any generic autonomous agent behavior.
