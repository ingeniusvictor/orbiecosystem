# NEWS-ECC-P2 — AgentShield Repository Baseline

Status: REPORT-ONLY / FIRST-RUN CLASSIFICATION PENDING

## Purpose

Create a fresh ORBI News security baseline using the pinned AgentShield configuration proven by the ORBI Agent Engineering Kit.

No accepted finding from Creative Studio, PVMetrics, L.U.M.I.A. or the Agent Kit is inherited.

## Pinning

AgentShield:

- package: `ecc-agentshield@1.6.0`
- commit: `b0891303bdcd6037376a94263d45cfd2ff3dfb98`

Actions:

- checkout v6.0.2: `de0fac2e4500dabe0009e67214ff5f5447ce83dd`
- upload-artifact v7.0.1: `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`

## Report-only guarantees

- `contents: read`;
- checkout credentials not persisted;
- no automatic fixes;
- findings do not block the workflow;
- online supply-chain lookup disabled;
- evidence pack is verified;
- evidence artifact is retained for review.

## News-specific review priorities

The first baseline must inspect finding classes involving:

- `GEMINI_API_KEY`, `CRON_SECRET`, Resend/social credentials;
- Firestore configuration and persistence;
- external source registry / URLs / web research;
- scheduler and autonomous execution surfaces;
- activation profiles, autonomy levels and toggles;
- publication/email/social paths;
- GitHub Actions and package supply chain;
- agent/harness instructions.

## Authority rule

A clean security scan does not authorize:

- runtime activation;
- autonomy escalation;
- enabling publication;
- changing kill switches or budgets;
- configuring credentials;
- treating AI output as verified fact.

## Exit criteria

P2 passes only when:

1. AgentShield completes;
2. evidence-pack verification passes;
3. supply-chain state is recorded;
4. every finding class is inspected;
5. any accepted false positive is justified from ORBI News evidence;
6. the P1 software gate stays GREEN;
7. no runtime/domain behavior changes.
