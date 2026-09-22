---
name: orbi-news-verification-review
description: Review ORBI News source research, claim verification, contradiction, risk, confidence, grounding and editorial-admission changes. Use when touching discovery-to-verification flow, source policy, verification records/engine/gates, canonical story grounding, AI claim extraction, or any change that could turn retrieved/generated content into a public factual claim.
version: "0.1.0"
license: MIT
metadata:
  origin: ORBI
  source_kit: ORBI Agent Engineering Kit
  authoritative: false
  runtime_dependency: false
---

# ORBI News Verification Review

Use this skill whenever a change can affect what ORBI News considers sufficiently verified for editorial use.

Repository code/tests and current `AGENTS.md` remain authoritative. Read the current verification/editorial contracts before applying this checklist.

## Core invariants

```text
DISCOVERY != VERIFICATION
SOURCE FETCHED != SOURCE TRUSTED
SUPPORTING SOURCE != PRIMARY SOURCE
CONFIDENCE SCORE != ABSOLUTE TRUTH
VERIFICATION GATE PASS != ABSOLUTE FACTUAL TRUTH
MODEL OUTPUT != VERIFIED NEWS FACT
GENERATED IMAGE != EVIDENTIARY SOURCE
EDITORIAL ALLOW != PUBLICATION PERMISSION
```

## 1. Inspect current governed contracts

Before review, inspect the current versions of:

- `domain/verification/verification.ts`
- `domain/verification/engine.ts`
- `domain/verification/policy.ts`
- `domain/verification/research-strategy.ts`
- `domain/verification/source-policy.ts`
- `domain/editorial/editorial-gate.ts`
- `domain/editorial/policy.ts`
- relevant deterministic verification/editorial tests.

Do not use this skill as a substitute for current code.

## 2. Evidence integrity

Every evidence item must preserve:

- source identity;
- source URL;
- source role;
- credibility band;
- stance: supporting / contradicting / neutral;
- publication time when known;
- retrieval time;
- claim summary.

Do not invent:

- a source ID;
- a URL;
- a primary-source role;
- an authoritative credibility band;
- a publication time;
- a quote;
- a supporting/contradicting stance.

Retrieval success proves only that content was retrieved.

## 3. Claim verification

Current engine behavior includes a deterministic claim-confidence calculation and status resolution.

At the current baseline:

- no supporting evidence -> confidence 0;
- contradicting evidence reduces confidence;
- a claim with contradicting evidence becomes `CONTRADICTED`;
- supported claims at the current threshold can become `VERIFIED`;
- weaker supported claims remain `PARTIALLY_VERIFIED`;
- no adequate support remains `UNVERIFIED`.

Treat these as software rules, not epistemic guarantees.

If thresholds or formulas change, require tests that show intended risk impact. Never weaken them merely to increase publication throughput.

## 4. Verification-record status

Current overall status is governed by claims:

- any contradicted claim can make the record `CONTRADICTED`;
- all verified claims can make it `VERIFIED`;
- mixed verified/non-verified claims can make it `PARTIALLY_VERIFIED`;
- otherwise it remains `UNVERIFIED`.

Do not silently discard a contradicting claim to improve the record status.

## 5. Verification gate

Preserve the current gate semantics:

- `CRITICAL` risk -> BLOCK;
- `CONTRADICTED` -> REQUIRE HUMAN REVIEW;
- unverified/in-progress/failed/not-started -> DEFER;
- `HIGH` risk -> REQUIRE HUMAN REVIEW;
- `PARTIALLY_VERIFIED` -> REQUIRE HUMAN REVIEW;
- confidence below `HIGH` -> REQUIRE HUMAN REVIEW;
- missing primary source -> REQUIRE HUMAN REVIEW;
- only the fully satisfied path may `ALLOW_EDITORIAL_PIPELINE`.

An allowed verification gate admits a story into editorial processing. It does not itself approve or publish the story.

## 6. Research strategy

For claim research preserve:

- primary-source search when required by sensitivity/risk;
- independent corroboration requirements;
- contradiction search when required;
- credibility-band minimums;
- source-count budgets.

An authoritative contradiction must remain a stop condition.

`SOURCE BUDGET EXHAUSTED != VERIFIED`

If the search budget ends without sufficient evidence, report the limitation rather than manufacturing certainty.

## 7. Risk and sensitive claims

Do not remove or bypass risk reasons such as:

- unverified claim;
- source conflict;
- legal/reputational sensitivity;
- financial claim;
- security incident;
- privacy concern;
- political content;
- medical claim;
- manipulated media;
- copyright risk.

High/critical risk must keep its stronger review behavior.

## 8. AI boundary

AI may assist with:

- claim extraction;
- summarization;
- drafting;
- research planning.

AI must not:

- fabricate evidence;
- assign a source role without governed evidence;
- convert its own output into corroboration;
- upgrade confidence or verification status outside deterministic contracts;
- erase contradictions;
- claim a source was checked when it was not.

Model output is an input to governed processing, not factual authority.

## 9. Editorial grounding

A canonical story must retain traceability to the verification record and source references.

Invalid grounding remains a BLOCK condition in the integrated editorial gate.

Do not modify generated prose in a way that introduces factual claims unsupported by the governed evidence set.

## 10. Verification workflow

For a verification-related change:

1. identify affected evidence/claim/gate contracts;
2. inspect the source and contradiction behavior;
3. check risk/confidence/primary-source impact;
4. inspect editorial grounding impact;
5. run matching deterministic verification/editorial tests;
6. run full News gate;
7. review final diff for factual-authority expansion;
8. report external evidence that CI did not exercise.

Full gate:

```bash
npm ci
npm run lint
npm run test:orbi-news
npm run build
```

## 11. Review report

Return:

```text
ORBI NEWS VERIFICATION REVIEW

Scope:
- branch/head:
- changed verification surfaces:

Evidence:
- primary source behavior:
- corroboration:
- contradiction:
- source credibility:
- source budget:

Claims:
- confidence/status impact:
- risk impact:
- grounding impact:

Authority:
- AI output promoted to evidence: YES/NO
- contradiction weakened: YES/NO
- human-review gate weakened: YES/NO
- publication authority changed: YES/NO

Validation:
- focused deterministic tests:
- full News tests:
- TypeScript:
- build:
- AgentShield if applicable:

Result:
- READY / PARTIALLY VERIFIED / NOT READY

Remaining evidence:
- ...
```

READY applies only to the software verification change, not to the absolute truth of a real-world news claim.

## Rollback

This skill is instruction-only. Remove its directory and profile/adapter registration to roll back.
