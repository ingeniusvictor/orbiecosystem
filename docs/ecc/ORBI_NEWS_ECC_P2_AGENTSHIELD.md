# NEWS-ECC-P2 — AgentShield Repository Baseline

Status: REPORT-ONLY / BASELINE CLASSIFIED

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

## First-run evidence

AgentShield run: `35684359987`

Result:

- scanner outcome: SUCCESS;
- score: **80 / 100**;
- grade: **B**;
- total findings: **397**;
- critical findings: **397**;
- unique finding classes: **1**;
- supply-chain status: **CLEAN**;
- evidence-pack verification: **PASSED**;
- evidence-pack digest: `sha256:40d48692bbbd7fda626dc721e1c50ae16bd39dae85e46b4c87854241bab6a0f5`;
- artifact ID: `10675688807`;
- artifact digest: `sha256:249c061d04fb80e47bdd57c32ff6ea9adf4cf0d3303b2ead7ec897df7f4f5108`.

## Finding classification

All **397 / 397** findings are the same detector class:

`Hardcoded Azure storage account key`

All point to `package-lock.json`.

Direct ORBI News repository inspection confirmed the matched material is standard npm Subresource Integrity metadata, for example:

```json
"integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw=="
```

The surrounding record is a normal npm dependency entry with `resolved: https://registry.npmjs.org/...`.

Classification:

`ACCEPTED_FALSE_POSITIVE — NPM_INTEGRITY_SHA512`

This acceptance is scoped only to the observed AgentShield detector class in ORBI News `package-lock.json`.

It does **not** authorize ignoring:

- values in `.env*`;
- Gemini keys;
- cron secrets;
- Firestore credentials;
- Resend credentials;
- social credentials;
- other files;
- future scanner classes.

The lockfile must not be redacted or rewritten to silence this detector because npm integrity fields are dependency integrity metadata.

No non-lockfile finding class was reported by the first run.
