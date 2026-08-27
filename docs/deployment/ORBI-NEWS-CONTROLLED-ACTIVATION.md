# ORBI News — Controlled Production Activation Runbook

## Scope

This runbook activates **Discovery only**. It does not authorize verification, drafting, image generation, email, web publication, Facebook or Instagram publication.

## Required server environment

Use secret/config management in the deployment platform. Never commit actual values.

```text
NODE_ENV=production
ORBI_NEWS_ACTIVATION_PROFILE=DISCOVERY_ONLY
ORBI_NEWS_RUNTIME_ENABLED=true
ORBI_NEWS_ORGANIZATION_ID=<organization-id>
ORBI_NEWS_WORKER_ID=<stable-worker-label>
ORBI_NEWS_SYSTEM_MODE=NORMAL
ORBI_NEWS_AUTONOMY_LEVEL=LEVEL_1
ORBI_NEWS_ENABLED_TOGGLES=AUTO_DISCOVERY
ORBI_NEWS_AVAILABLE_CAPABILITIES=NEWS_DISCOVERY
ORBI_EDITORIAL_FIRESTORE_ENABLED=true
ORBI_EDITORIAL_FIRESTORE_PROJECT_ID=<gcp-project-id>
ORBI_EDITORIAL_FIRESTORE_DATABASE_ID=<optional-database-id>
ORBI_NEWS_SCHEDULER_TOKEN=<secret-at-least-32-chars>
ORBI_NEWS_SOURCE_REGISTRY_JSON=<validated-json-array>
```

Do **not** include any publishing, social, email, image, drafting or verification toggle/capability in the first activation profile.

## Source registry requirements

Each source must be explicit, HTTPS-only and organization-scoped. At least one active RSS source is required for `DISCOVERY_ONLY` preflight.

The registry is configuration, not editorial truth. Discovery candidates remain unverified until they pass the verification pipeline.

## Deployment sequence

1. Deploy with `ORBI_NEWS_ACTIVATION_PROFILE=DISABLED` and `ORBI_NEWS_RUNTIME_ENABLED=false`.
2. Confirm service health and existing public/editorial routes.
3. Configure Firestore IAM/ADC for the runtime service account.
4. Load the scheduler token through secret management.
5. Load and validate the source registry JSON.
6. Run the controlled-activation preflight.
7. Change only to the exact Discovery-only profile above.
8. Invoke one scheduler discovery tick manually through the authenticated internal endpoint.
9. Confirm exactly one execution lease, one operational run ledger entry, and expected discovery candidate documents.
10. Replay the same tick and confirm idempotent/duplicate behavior.
11. Only after observation should Cloud Scheduler be enabled at the hourly cadence.

## Rollback / emergency stop

Preferred immediate rollback:

```text
ORBI_NEWS_ACTIVE_KILL_SWITCHES=NEWS_DISCOVERY
```

or disable the runtime entirely:

```text
ORBI_NEWS_RUNTIME_ENABLED=false
ORBI_NEWS_ACTIVATION_PROFILE=DISABLED
```

Do not raise autonomy to compensate for errors. Diagnose failures from the operational run ledger and health snapshot.

## Explicitly out of scope

- Automatic web publication
- Automatic social publication
- Automatic email delivery
- Autonomous verification/drafting/image generation
- Commercial web-search provider activation
- Production deployment itself

Those require separate explicit configuration and gates.
