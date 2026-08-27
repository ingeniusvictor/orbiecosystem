# ADR-087 — Standalone Runtime Service & Deployment Readiness

## Status
Accepted — **NA-13 PASS / CLOSED**.

## Decision
ORBI News autonomous operations run as a standalone server-side service rather than being coupled to the corporate website process.

The service consists of:

- `orbi-news-runtime.ts` executable entrypoint;
- side-effect-free `runtime-service-app.ts` application factory;
- `/healthz` readiness endpoint;
- controlled Discovery-only runtime mount;
- dedicated `build:orbi-news-runtime` and `start:orbi-news-runtime` scripts;
- `Dockerfile.orbi-news-runtime`;
- Cloud Run and Cloud Scheduler templates under `infra/orbi-news/`.

The default deployment template remains inert (`DISABLED`, runtime false, `MAINTENANCE`, `LEVEL_0`). Activation must follow ADR-086 and the controlled activation runbook.

## Safety
Malformed activation configuration fails fast. The runtime app does not share lifecycle or authority with the corporate website server. No secret values are committed.

## Closure evidence
GitHub Actions run `33073166624` completed successfully with:

- dependency installation: PASS;
- TypeScript validation: PASS;
- complete deterministic ORBI News suite: PASS;
- production build validation: PASS.

The build validates both the existing site bundle and the standalone ORBI News runtime bundle.

Therefore **NA-13 — Standalone Runtime Service & Deployment Readiness is CLOSED / PASS**.

## External boundary
The next actions require an actual Google Cloud project/environment and are intentionally not simulated as completed:

- create/configure Firestore database and IAM/ADC;
- create Artifact Registry/build image;
- deploy Cloud Run service;
- provision scheduler secret through secret management;
- configure the real source registry;
- manually activate `DISCOVERY_ONLY`;
- execute one smoke tick and inspect durable state;
- enable Cloud Scheduler only after observation.

No publishing capability should be enabled during this first activation.
