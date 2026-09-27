# ORBI News — Vercel Staging Runbook

## Purpose

Validate ORBI News end-to-end in the user's Vercel team before touching the production Vercel project that serves the public ORBI website.

## Staging scheduling constraint

The current canonical branch does not define automatic cron schedules in either `vercel.json` or `vercel.staging.json`. Staging ticks are therefore triggered manually through the protected cron endpoints.

The existence of a cron route does not mean Vercel is scheduling it. Production scheduling remains a separate deployment decision and must be verified explicitly before activation.

## Deployment target

- Team: `ORBI`
- Suggested project name: `orbi-news-staging`
- Git source: `ingeniusvictor/orbiecosystem`
- Canonical News branch: `staging/orbi-news-vercel`
- Framework/build: existing Vite + Vercel Functions project
- Alternate local config for CLI deployment: `vercel.staging.json`

Example CLI after project linking:

```text
vercel link --scope orbi4
vercel deploy --local-config vercel.staging.json
```

Use Vercel project environment variables. Never commit secret values.

## Stage 0 — inert deployment

Start with:

```text
ORBI_NEWS_ACTIVATION_PROFILE=DISABLED
ORBI_NEWS_RUNTIME_ENABLED=false
ORBI_NEWS_SYSTEM_MODE=MAINTENANCE
ORBI_NEWS_AUTONOMY_LEVEL=LEVEL_0
```

Expected results:
- frontend loads;
- `/news` loads;
- `/api/news` responds without exposing private data;
- cron endpoints reject requests without the configured `CRON_SECRET`;
- no discovery, Gemini research, publication or email is performed.

## Keyless Firestore identity

Staging uses Vercel OIDC -> Google Cloud Workload Identity Federation. No service-account JSON key is stored in Vercel or GitHub.

Non-secret staging identifiers:

```text
ORBI_EDITORIAL_FIRESTORE_ENABLED=true
ORBI_EDITORIAL_FIRESTORE_PROJECT_ID=cs-project-95cg3lcv
ORBI_EDITORIAL_FIRESTORE_DATABASE_ID=orbi-news-staging
ORBI_EDITORIAL_FIRESTORE_AUTH_MODE=VERCEL_OIDC
ORBI_EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER=1028562296104
ORBI_EDITORIAL_FIRESTORE_WIF_POOL_ID=orbi-vercel
ORBI_EDITORIAL_FIRESTORE_WIF_PROVIDER_ID=orbi-news-preview
ORBI_EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_EMAIL=orbi-news-vercel@cs-project-95cg3lcv.iam.gserviceaccount.com
```

The Google provider accepts only Vercel Preview identity for:

```text
owner:orbi4:project:orbi-news-staging:environment:preview
```

The service account has `roles/datastore.user`; the Firestore database is `orbi-news-staging` in `southamerica-west1` with delete protection enabled.

## Stage 1 — Discovery only

Set exactly:

```text
ORBI_NEWS_ACTIVATION_PROFILE=DISCOVERY_ONLY
ORBI_NEWS_RUNTIME_ENABLED=true
ORBI_NEWS_SYSTEM_MODE=NORMAL
ORBI_NEWS_AUTONOMY_LEVEL=LEVEL_1
ORBI_NEWS_ENABLED_TOGGLES=AUTO_DISCOVERY
ORBI_NEWS_AVAILABLE_CAPABILITIES=NEWS_DISCOVERY
ORBI_EDITORIAL_FIRESTORE_ENABLED=true
ORBI_EDITORIAL_FIRESTORE_PROJECT_ID=cs-project-95cg3lcv
ORBI_EDITORIAL_FIRESTORE_DATABASE_ID=orbi-news-staging
ORBI_EDITORIAL_FIRESTORE_AUTH_MODE=VERCEL_OIDC
ORBI_EDITORIAL_FIRESTORE_GCP_PROJECT_NUMBER=1028562296104
ORBI_EDITORIAL_FIRESTORE_WIF_POOL_ID=orbi-vercel
ORBI_EDITORIAL_FIRESTORE_WIF_PROVIDER_ID=orbi-news-preview
ORBI_EDITORIAL_FIRESTORE_SERVICE_ACCOUNT_EMAIL=orbi-news-vercel@cs-project-95cg3lcv.iam.gserviceaccount.com
```

After the local repository is linked to the staging Vercel project, pull the Preview environment into a gitignored local file:

```text
vercel env pull .env.staging.local --environment=preview
```

Then run the side-effect-free staging preflight:

```text
npm run preflight:orbi-news:staging
```

The command automatically reads `.env.staging.local` when the file exists. An alternate file can be selected with `ORBI_NEWS_PREFLIGHT_ENV_FILE`.

The command validates the Vercel Discovery-only configuration and prints only a redacted readiness report: profile, source counts, reason codes and boolean presence checks. For Vercel staging, `ready: true` also requires the complete keyless Firestore WIF identity contract above. It does not print secret values or source-registry payload contents, and it does not call RSS, Firestore, Gemini, publication or email providers.

A ready report must return `"ready": true` before the first live discovery tick.

Manually invoke:

```text
GET /api/cron/orbi-news-discovery
Authorization: Bearer <CRON_SECRET>
```

Confirm Firestore receives discovery candidates and operational run/lease records. Replay once to verify idempotent behavior.

## Stage 2 — Editorial assisted

Set exactly:

```text
ORBI_NEWS_ACTIVATION_PROFILE=EDITORIAL_ASSISTED
ORBI_NEWS_AUTONOMY_LEVEL=LEVEL_3
ORBI_NEWS_ENABLED_TOGGLES=AUTO_DISCOVERY,AUTO_VERIFICATION,AUTO_DRAFT
ORBI_NEWS_AVAILABLE_CAPABILITIES=NEWS_DISCOVERY,WEB_RESEARCH,VERIFICATION,EVENT_INTELLIGENCE,SCORING,EDITORIAL_GENERATION
```

Keep web publication disabled. Invoke Discovery, then manually invoke:

```text
GET /api/cron/orbi-news-process
Authorization: Bearer <CRON_SECRET>
```

Confirm a valid story reaches the editorial queue as `READY_FOR_REVIEW`. Confirm insufficient corroboration/high risk does not publish.

## Stage 3 — Controlled web autonomy

Only after Stage 2 passes, change to the exact `WEB_AUTONOMOUS` profile required by the code. Publication remains constrained by deterministic policy: LOW risk, VERY_HIGH verification confidence, ORBI score >=75, eligible primary source, at least two independent source domains, non-breaking, publication authority and publication gate.

Trigger Processing manually and confirm eligible stories appear in `/news`. Confirm MEDIUM/HIGH/CRITICAL or weakly corroborated stories stay in review.

## Stage 4 — Daily digest

Configure Resend and recipient variables, then invoke the digest endpoint during its 09:00 `America/Santiago` gate. Confirm one email is sent and a replay returns an idempotent already-sent/in-progress result rather than sending twice.

## Staging exit criteria

Staging is considered validated only after:
1. deployment/build succeeds;
2. `/news` and public APIs work;
3. unauthorized cron invocation is rejected;
4. Discovery stores real candidates;
5. processing produces grounded editorial records;
6. non-eligible stories do not auto-publish;
7. at least one eligible test story publishes to staging `/news`;
8. daily digest sends exactly once;
9. duplicate ticks/replays remain idempotent;
10. no secrets exist in GitHub.

Once all ten pass, transfer the same code and approved environment configuration to the production Vercel project. Production cron scheduling must then be introduced or verified separately, subject to the selected Vercel plan and deployment policy.
