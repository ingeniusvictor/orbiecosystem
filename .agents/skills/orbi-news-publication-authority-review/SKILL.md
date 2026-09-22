---
name: orbi-news-publication-authority-review
description: Review ORBI News publication, activation, autonomy, editorial and distribution authority boundaries. Use when touching publication gates, autonomous web publishing, social distribution, runtime activation, editorial controls, channel credentials or content that may become public.
version: "0.1.0"
license: MIT
metadata:
  origin: ORBI
  authoritative: false
  runtime_dependency: false
---

# ORBI News Publication Authority Review

Use this skill when a change can affect whether ORBI News content becomes publicly visible or operationally activated.

This skill is advisory/instructional. Repository code, deterministic domain policies, ADRs, CI and explicit operator configuration remain authoritative.

## Core distinctions

Preserve:

`DISCOVERY != VERIFICATION`

`VERIFICATION GATE PASS != ABSOLUTE FACTUAL TRUTH`

`EDITORIAL ALLOW != PUBLICATION PERMISSION`

`OPERATIONAL ALLOW != PUBLICATION AUTHORITY`

`RUNTIME READY != ACTIVATION AUTHORIZATION`

`WEB_AUTONOMOUS != SOCIAL / EMAIL / IMAGE AUTONOMY`

`MODEL OUTPUT != VERIFIED NEWS FACT`

`GENERATED IMAGE != EVIDENTIARY SOURCE`

## 1. Publication gate

Current publication policy must remain the first authority for channel publication.

Review:

- system mode;
- global publishing enablement;
- channel enablement;
- duplicate idempotency key;
- retry budget;
- risk level;
- story status;
- channel-specific review requirements.

Current important semantics include:

- EMERGENCY_STOP / MAINTENANCE -> BLOCK;
- READ_ONLY -> DEFER;
- disabled publishing/channel -> BLOCK;
- duplicate idempotency -> BLOCK;
- retry budget exhausted -> BLOCK;
- CRITICAL risk -> BLOCK;
- HIGH risk -> REQUIRE_REVIEW;
- Facebook/Instagram -> REQUIRE_REVIEW in v1.

Do not turn a UI state, model recommendation or editorial decision into direct publication authority.

## 2. Editorial authority

An editorial action permission is necessary but not sufficient.

Preserve:

- deterministic story state;
- integrated editorial gate;
- breaking eligibility;
- publication state machine;
- role permissions.

OWNER cannot bypass deterministic blocks.

UI controls do not create authority merely because a button is visible.

## 3. Autonomous web publication

The autonomous web policy is narrow and operator-authorized.

Current eligibility requires at least:

- story already review-ready;
- LOW risk;
- VERY_HIGH verification confidence;
- ORBI score >= configured threshold;
- not BREAKING;
- at least one primary source;
- at least two independent HTTPS source hosts.

Even when eligible:

`AUTONOMOUS_WEB_ELIGIBLE != RUNTIME_ACTIVATED`

`AUTONOMOUS_WEB_ELIGIBLE != SOCIAL_PUBLICATION_ALLOWED`

`AUTONOMOUS_WEB_ELIGIBLE != OPERATOR_APPROVAL_TO_CHANGE_PROFILE`

Never widen this gate indirectly through score, source-count, risk or confidence changes without explicit policy review.

## 4. Runtime activation

Production runtime defaults remain fail-safe:

- disabled by default;
- MAINTENANCE;
- LEVEL_0.

Changing environment configuration into an active profile is a governed operational action.

The first controlled activation profile is DISCOVERY_ONLY and requires an exact allowlist.

Do not infer activation authority from:

- successful build;
- successful CI;
- provider readiness;
- a passing publication gate;
- a successful agent/tool execution.

## 5. Social distribution

Social V1 remains manual.

The system may:

- build social copy;
- calculate hashtags/CTA;
- create READY social packages;
- track manual publication state.

It must not infer:

- email SENT => Facebook/Instagram posted;
- Facebook POSTED => Instagram POSTED;
- generated social package => authorization to publish.

Meta/API automation is outside current V1 authority unless a later governed phase explicitly changes it.

## 6. Secret/provider/channel boundary

Publication credentials, provider keys, Firestore configuration, scheduler tokens, email credentials and social credentials remain external privileged configuration.

Agent output may not:

- invent credentials;
- expose secrets;
- write them into source/docs;
- change Vercel/provider configuration without explicit authorization;
- treat a local/example configuration as production readiness.

## 7. Factual integrity before publication

Before public publication, ensure the relevant verification/factual-integrity review has completed.

Use `orbi-news-verification-review` when the change concerns:

- source trust;
- claim confidence;
- contradiction;
- grounding;
- risk;
- evidence.

A publication skill does not independently establish factual truth.

## 8. Review report

Return:

```text
ORBI NEWS PUBLICATION AUTHORITY REVIEW

Scope:
- branch/head:
- changed publication/runtime/editorial surfaces:

Publication:
- channel:
- system mode:
- publishing enabled:
- channel enabled:
- risk:
- story status:
- idempotency:
- retry budget:

Autonomy:
- activation profile changed: YES/NO
- autonomy level changed: YES/NO
- automation toggles changed: YES/NO
- kill switch changed: YES/NO

Authority:
- human review required: YES/NO
- external credentials required: YES/NO
- actual publication performed: YES/NO

Verification:
- factual verification skill required: YES/NO
- CI:
- AgentShield if applicable:

Result:
- READY / NOT READY / PARTIALLY VERIFIED
```

READY means the reviewed software/policy change is verified. It does not imply a publication was executed.

## Rollback

This skill is instruction-only. Remove its directory and manifest/adapter routing entry to roll back.
