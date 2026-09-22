# NEWS-ECC-P8 — ORBI News Agent Kit Pilot Certification

Status: SELECTIVE ADOPTION READY  
Pilot repository: `ingeniusvictor/orbiecosystem`  
Canonical News branch: `staging/orbi-news-vercel`  
Certified baseline before P8: `3914329c25d20667a1341c7b02e6526929be7efc`

## Purpose

Close the fourth ORBI Agent Engineering Kit portability pilot with an evidence-backed News-specific certification and portable profile.

This certifies the **engineering/agent-governance layer around ORBI News**, not real publication-channel readiness or provider/runtime readiness.

## Source Kit

- repository: `ingeniusvictor/orbi-agent-kit`
- v0.2 development core through K2-03
- canonical Kit commit used by this pilot: `27ae18c74eb67a3f311b00ac406555369f00ca40`
- adapter schema: `orbi.repository.adapter.v1`

## Upstream references

- ECC 2.2.2 — `91ba9b4cf6c47c8130829004f8bb64762a76ccbb`
- AgentShield 1.6.0 — `b0891303bdcd6037376a94263d45cfd2ff3dfb98`

## Pilot history

| Phase | PR | Result |
|---|---:|---|
| P1 | #1 | Agent Kit adapter + staging PR gate |
| P2 | #2 | News-specific AgentShield baseline |
| P3 | #3 | DAILY/LIBRARY agent/skill classification |
| P4 | #4 | `orbi-news-verification-review` |
| P5 | #5 | `orbi-news-publication-authority-review` |
| P6 | #6 | structured News agent harness |
| P7 | #7 | context budget/selective loading |
| P7.1 | #8 | corrected context-budget self accounting |

## Materialized News engineering layer

### Root governance

`AGENTS.md`

Preserves:

- factual verification boundaries;
- activation/runtime authority;
- editorial/publication authority;
- provider/secret boundaries;
- CI-vs-production evidence separation;
- Agent Kit selective-adoption limits.

### News-owned skills

- `orbi-news-verification-review`
- `orbi-news-publication-authority-review`
- `orbi-news-agent-harness`
- `orbi-news-context-budget`

### Structured harness

- `.orbi/orbi-news-agent-observation-v1.schema.json`
- `scripts/validate-orbi-news-agent-observation.mjs`
- deterministic harness tests

### Repository adapter

`.orbi/repository-adapter.json`

Declares exact verification commands, external evidence, authority domains, AgentShield scope and skill routing.

## Final pre-certification evidence

P7.1 head: `8a572c0dc01d670fe6bbede7f58d3ced77a14ef4`

### ORBI News ECC Pull Request Gate

Run: `35686452513`

PASS:

- exact dependency install;
- TypeScript validation;
- ORBI News deterministic test suite;
- production build.

Observed deterministic tests:

- **528 / 528 PASS**
- failures: **0**

Production build:

- **1733 modules transformed**
- build PASS

### AgentShield

Run: `35686452554`

- workflow: SUCCESS;
- score: **80 / 100**;
- grade: **B**;
- findings: **397**;
- unique finding classes: **1**;
- finding class: `Hardcoded Azure storage account key` in `package-lock.json`;
- classification: `ACCEPTED_FALSE_POSITIVE — NPM_INTEGRITY_SHA512`;
- supply chain: **CLEAN**;
- evidence-pack verification: **PASSED**;
- evidence-pack digest: `sha256:ad66f4f8b53ca018b2013381124ccaaa0da41935dae41265ad427f5858bcd015`;
- artifact ID: `10676264071`;
- artifact digest: `sha256:0a7d719b3d05b9fb70f7a925391b26887d6e6e0eff2ce71a4537f5b436522efe`.

No additional finding class was present.

## Certified News evidence boundaries

```text
DISCOVERY != VERIFICATION
SOURCE FETCHED != SOURCE TRUSTED
MODEL OUTPUT != VERIFIED NEWS FACT
VERIFICATION GATE PASS != ABSOLUTE FACTUAL TRUTH
GENERATED IMAGE != EVIDENTIARY SOURCE

OPERATIONAL ALLOW != PUBLICATION AUTHORITY
RUNTIME READY != ACTIVATION AUTHORIZATION
EDITORIAL ALLOW != WEB OR SOCIAL PUBLICATION PERMISSION
WEB_AUTONOMOUS != SOCIAL / EMAIL / IMAGE AUTONOMY

CI GREEN != VERCEL / FIRESTORE / PROVIDER / CHANNEL READINESS
```

These remain explicit authority boundaries after certification.

## Publication authority

The Agent Kit layer has no authority to:

- activate production/runtime profiles;
- raise autonomy level;
- enable automation toggles;
- disable kill switches;
- configure publication/provider secrets;
- convert model output into a verified factual claim;
- bypass verification/editorial/publication gates;
- authorize social publication;
- treat CI as production/provider/channel readiness.

Web-autonomous behavior, where already allowed by the separately governed ORBI News product policy, remains subject to exact activation profile and downstream gates. This certification does not widen that scope.

## External evidence not proven by CI

CI does **not** prove:

- Vercel staging/production secrets;
- Firestore production access;
- real provider reachability;
- Gemini/provider availability;
- email/social credentials;
- real web/social publication channel readiness.

These remain external/runtime evidence.

## Context-budget result

The News loading model is:

- `AGENTS.md` = persistent invariants;
- 4 News project skills = conditional/discoverable;
- profile/adapter/observation schema = on-demand config references.

The context-budget auditor includes itself in the discoverable-skill count after P7.1.

The rule remains:

**discoverable != permanently loaded**

Safety/authority guidance may not be removed merely to reduce context size.

## What is portable from News

### Portable with review

- repository adapter pattern for exact gates/external evidence/authority domains;
- factual-verification vs model-output separation;
- publication/activation authority separation;
- external-channel readiness vs CI separation;
- conditional loading of publication-specific skills;
- structured agent observation with product-authority fields.

### News-specific and must not be copied blindly

- activation profiles;
- autonomy levels;
- publication gates;
- web/social/email policy;
- source credibility / research / contradiction rules;
- canonical story grounding;
- News AgentShield accepted baseline;
- exact News build/test commands.

## Deliberately disabled

- full ECC install;
- Agent Kit hooks;
- MCP;
- continuous learning;
- unified memory;
- Agent Kit autonomous loops;
- multi-agent runtime roles.

ORBI News product autonomy exists separately under product-owned contracts. This certification does not enable Agent Kit autonomous loops.

## Rollback

The News Agent Kit layer remains removable independently from product runtime:

- remove project skills;
- remove News observation schema/validator/tests;
- remove adapter/profile/docs/workflows;
- retain product runtime/domain code unchanged.

## Certification conclusion

ORBI News proves the Agent Kit portable pattern across a fourth, materially different project: factual research, verification, editorial policy, runtime activation and publication channels.

Approved pattern:

`Kit adapter -> News evidence -> fresh security baseline -> selective skills -> structured harness -> context budget -> certification`

NEWS-ECC-P8 certifies the current selective News engineering layer as suitable for continued use while publication authority, runtime activation and real-channel readiness remain separately governed.
