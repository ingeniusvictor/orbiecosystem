# NEWS-ECC-P1 — ORBI News Agent Kit Inventory and Adapter Baseline

Status: CONTROLLED / NO PRODUCT-RUNTIME CHANGE

Base branch: `staging/orbi-news-vercel`  
Audited baseline: `fda4aa198b6f706e13dcc4805560e8eb6d836ebd`

## Purpose

Apply the certified ORBI Agent Engineering Kit selective-adoption pattern to ORBI News without replacing the existing corporate/competition governance or changing the autonomous News runtime.

P1 introduces only:

- a validated-style repository adapter;
- an ORBI News ECC/Agent Kit profile;
- ORBI News-specific additions to the existing root `AGENTS.md`;
- a dedicated pull-request validation gate for `staging/orbi-news-vercel`.

No News domain/runtime/provider/publication source is changed.

## Why ORBI News is a distinct fourth pilot

ORBI News has authority surfaces not present in the prior pilots:

- discovery from external sources;
- verification and contradiction handling;
- AI editorial generation;
- image generation;
- Firestore persistence;
- scheduler/execution leases;
- email delivery;
- web publication;
- Facebook/Instagram publication;
- explicit autonomy levels `LEVEL_0..LEVEL_5`;
- automation toggles;
- kill switches;
- daily/retry budgets;
- controlled production activation profiles.

The Agent Kit layer must preserve those existing product gates rather than becoming a parallel authority system.

## Existing safe product defaults

The current production runtime defaults are intentionally safe:

`RUNTIME DISABLED + MAINTENANCE + LEVEL_0`

The controlled activation profiles are exact allow-lists:

- `DISABLED`
- `DISCOVERY_ONLY`
- `EDITORIAL_ASSISTED`
- `WEB_AUTONOMOUS`

The Agent Kit has no authority to change any of them.

## Existing authority model

The product code already establishes that an operational `ALLOW` permits autonomous orchestration to **attempt** an operation. It explicitly does not replace downstream editorial, visual, social, state-machine, persistence or audit gates.

P1 therefore codifies:

`OPERATIONAL ALLOW != PUBLICATION AUTHORITY`

`DISCOVERY != VERIFICATION`

`VERIFICATION GATE PASS != ABSOLUTE FACTUAL TRUTH`

`MODEL OUTPUT != VERIFIED NEWS FACT`

`RUNTIME READY != ACTIVATION AUTHORIZATION`

`EDITORIAL ALLOW != WEB OR SOCIAL PUBLICATION PERMISSION`

`WEB_AUTONOMOUS != SOCIAL EMAIL OR IMAGE AUTONOMY`

`GENERATED IMAGE != EVIDENTIARY SOURCE`

`SOURCE FETCHED != SOURCE TRUSTED`

`CI GREEN != VERCEL FIRESTORE PROVIDER OR CHANNEL READINESS`

## Social/publication boundary

Current publication policy requires Facebook/Instagram publication to receive human review in v1.

The Agent Kit layer must not weaken that rule.

Likewise, `WEB_AUTONOMOUS` represents an operator-authorized exact profile for deterministic low-risk web publication only. It does not authorize social, email or image automation.

## Adapter

`.orbi/repository-adapter.json`

uses `orbi.repository.adapter.v1` and records:

- canonical News branch;
- exact deterministic gates;
- external evidence CI cannot prove;
- News authority domains;
- repository-specific AgentShield scope;
- no inherited accepted security findings.

Every authority domain keeps:

`agentMayAuthorize: false`

## Existing AGENTS.md

The existing corporate/competition instructions are preserved.

P1 appends News-specific governance instead of replacing the file.

For ORBI News work, the active development base is `staging/orbi-news-vercel`. The existing competition branch instruction remains applicable to competition modules, not to News work.

## New PR gate

The existing `orbi-news-domain-tests.yml` currently targets pushes to `feature/orbi-news-agent` and uses floating action tags.

P1 does not rewrite that historical workflow.

Instead it adds:

`.github/workflows/orbi-news-ecc-pr-gate.yml`

for pull requests into `staging/orbi-news-vercel`, with:

- `contents: read`;
- SHA-pinned checkout/setup-node;
- `persist-credentials: false`;
- Node 22;
- `npm ci`;
- `npm run lint`;
- `npm run test:orbi-news`;
- `npm run build`.

## External evidence boundary

CI cannot prove:

- Vercel production/staging secret correctness;
- Firestore production access;
- real source/network availability;
- Gemini/provider availability;
- email delivery;
- Facebook/Instagram credentials/readiness;
- actual publication behavior in external platforms.

Those must remain separate evidence.

## P1 non-goals

P1 does not:

- enable ORBI News runtime;
- change system mode or autonomy level;
- change activation profile;
- enable toggles/capabilities;
- disable kill switches;
- change budgets;
- change verification/editorial/publication policy;
- configure secrets;
- publish content;
- install ECC wholesale;
- add hooks, MCP, memory or Agent Kit autonomous loops.

## Next

NEWS-ECC-P2 should establish a fresh ORBI News AgentShield report-only baseline.

No accepted finding class from Creative Studio, PVMetrics, L.U.M.I.A. or the Agent Kit itself may be inherited automatically.
