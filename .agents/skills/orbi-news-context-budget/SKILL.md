---
name: orbi-news-context-budget
description: Keep ORBI News agent instructions layered so verification, publication and harness procedures remain discoverable/on-demand instead of permanently consuming context.
version: "0.1.0"
license: MIT
metadata:
  origin: ORBI
  authoritative: false
  runtime_dependency: false
---

# ORBI News Context Budget

Use when adding or expanding AGENTS instructions, project skills, adapter/profile rules or agent-harness configuration.

## Loading model

- `AGENTS.md` -> persistent invariants;
- project skills -> discoverable/conditional;
- profile/adapter/schema -> config-reference/on-demand.

Available does not mean permanently loaded.

## Rules

- keep safety/authority invariants in AGENTS;
- keep factual-verification procedures in `orbi-news-verification-review`;
- keep publication/activation rules in `orbi-news-publication-authority-review`;
- keep action-space/recovery rules in `orbi-news-agent-harness`;
- keep machine-readable routing/state in profile/adapter/schema;
- do not duplicate full ADR text into persistent instructions;
- do not remove authority guidance solely to reduce token estimates.

## Auditor

```bash
node scripts/ecc-orbi-news-context-budget.mjs
node scripts/ecc-orbi-news-context-budget.mjs --json
```

Estimates are revision-comparison signals, not exact model-token accounting.

## Safety

Context optimization must never weaken:
- factual verification;
- human-review requirements;
- publication authority;
- activation controls;
- kill switches;
- secret boundaries.

## Rollback

Remove the skill, auditor/test and routing registration. No product runtime depends on them.
