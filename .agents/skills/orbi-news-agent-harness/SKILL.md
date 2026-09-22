---
name: orbi-news-agent-harness
description: Design or review bounded ORBI News agent/tool workflows, structured observations, recovery and stop conditions across discovery, verification, editorial, publication and activation boundaries.
version: "0.1.0"
license: MIT
metadata:
  origin: ORBI
  authoritative: false
  runtime_dependency: false
---

# ORBI News Agent Harness

Use when creating or changing an agent-like workflow, tool contract, structured handoff or bounded automation around ORBI News.

## Action-space tiers

### Read-only

Preferred default:

- inspect sources and provider outputs;
- inspect verification/editorial/publication state;
- inspect CI and runtime-readiness snapshots;
- analyze canonical story evidence;
- inspect configuration examples.

### Reversible repository mutation

Allowed only inside the authorized development workflow:

- feature-branch code/docs/tests;
- synthetic fixtures;
- adapter/profile updates.

Require diff + rollback.

### External/public mutation

Examples:

- public web publication;
- email delivery;
- social publication;
- production activation/configuration;
- secret/provider configuration.

These are not granted by this harness. They remain governed by product policy + explicit task/operator authority.

## Structured observation

Schema:

`.orbi/orbi-news-agent-observation-v1.schema.json`

Validator:

```bash
node scripts/validate-orbi-news-agent-observation.mjs <observation.json>
```

Every observation reports explicit impact on:

- production activation profile;
- runtime enabled state;
- autonomy level;
- automation toggles;
- kill switches;
- canonical factual claims;
- web publication;
- social publication;
- secret/provider configuration.

Omission is not interpreted as false.

## Recovery

Error observations require:

- root-cause hint;
- safe retry;
- stop condition.

A retry must change evidence, hypothesis, input, scope or implementation.

Stop when:

- source/evidence is insufficient;
- contradiction remains unresolved;
- the same failure repeats without new evidence;
- external provider/channel readiness is unknown;
- the next action would cross activation/publication/secret authority.

## Skill routing

Use:

- `orbi-news-verification-review` for factual/evidence/grounding work;
- `orbi-news-publication-authority-review` for publication/autonomy/activation work.

## Non-authority

A valid structured observation does not:

- verify a news fact by itself;
- approve editorial content;
- activate runtime;
- publish content;
- authorize secrets;
- bypass product gates.

## Rollback

Remove harness skill/schema/validator/test and profile registration. No product runtime may depend on them.
