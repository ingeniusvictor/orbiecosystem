# NEWS-ECC-P4 — ORBI News Verification Review Skill

Status: CONTROLLED / FIRST NEWS PROJECT SKILL

## Skill

`.agents/skills/orbi-news-verification-review/SKILL.md`

## Why this skill first

NEWS-ECC-P3 identified factual verification as the most important recurring News-specific engineering boundary.

The skill is grounded in the current repository contracts for:

- verification evidence;
- claims;
- confidence;
- contradiction;
- risk;
- source roles/credibility;
- research strategy;
- verification gate;
- integrated editorial gate;
- canonical-story grounding.

## Important distinction

The skill does not create a second verification engine.

It reviews changes against the actual deterministic engine and requires the reviewer to read current contracts first.

## Preserved boundaries

`DISCOVERY != VERIFICATION`

`SOURCE FETCHED != SOURCE TRUSTED`

`MODEL OUTPUT != VERIFIED NEWS FACT`

`VERIFICATION GATE PASS != ABSOLUTE FACTUAL TRUTH`

`GENERATED IMAGE != EVIDENTIARY SOURCE`

`EDITORIAL ALLOW != PUBLICATION PERMISSION`

## No runtime authority

P4 does not:

- fetch a real source;
- change risk/confidence thresholds;
- activate News runtime;
- publish a story;
- configure providers;
- grant AI factual authority.

## Routing

The skill is conditional, not permanently loaded.

Triggers include verification engine/policy, research/source policy, contradiction, claim confidence, canonical grounding and factual/editorial evidence changes.

## Validation

P4 requires:

- AgentShield baseline stable;
- 521-test News suite GREEN;
- TypeScript GREEN;
- production build GREEN;
- no product/runtime source change in the P4 PR itself.
