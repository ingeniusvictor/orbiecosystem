# ADR-088 — Vercel Native Runtime Adaptation

## Status
Accepted — NA-14 final gate candidate.

## Context
The original ORBI News production goal is narrower than a permanently running autonomous backend: discover and process relevant news, publish approved articles on the ORBI website, and send one daily email digest to the operator.

The ORBI corporate website is Vercel-hosted, so the preferred execution layer is Vercel Functions + Vercel Cron. The standalone Cloud Run runtime from ADR-087 remains a fallback and is not deleted.

## Decision
Vercel-native execution is composed from the existing deterministic ORBI News contracts instead of replacing them.

### Scheduled discovery
- `/api/cron/orbi-news-discovery`
- invoked hourly by Vercel Cron;
- authenticated with Vercel `CRON_SECRET` using `Authorization: Bearer ...`;
- request cannot choose organization, action, autonomy or capabilities;
- reuses RSS discovery, Firestore candidate sink, operational authority, health policy, leases and run ledger.

### Public ORBI News API
The existing frontend paths remain stable:
- `GET /api/news`
- `GET /api/news/category/:category`
- `GET /api/news/:slug`

Vercel Functions read from the durable Firestore public-news store. Only records whose canonical story, publication status and channel are already `PUBLISHED / PUBLISHED / ORBI_WEB` are returned by the existing public-news service.

### Web publication adapter
An approved CanonicalStory is not written to the public store directly. `publishApprovedStoryToWeb` first requires:
1. `OperationalAction.PUBLISH_WEB` authority ALLOW;
2. existing deterministic Publication Gate ALLOW;
3. no existing article/slug replay.

HIGH risk remains human-review only and insufficient autonomy defers publication.

### Daily digest
- `/api/cron/orbi-news-digest` is invoked periodically;
- the application resolves the editorial time in `America/Santiago` and sends only during the 09:00 local hour;
- only public web publications for that editorial date are included;
- a durable Firestore daily receipt prevents duplicate sends;
- the email provider also receives a deterministic idempotency key;
- Resend is the initial replaceable provider through direct server-side HTTPS API calls; no API key is committed.

### Vercel scheduling
`vercel.json` invokes Discovery on the hour and the digest route at minute 15 of every hour. The latter intentionally uses an application-local Santiago time gate so daylight-saving changes do not shift the intended daily delivery time.

## Required server-side configuration
No values are committed. Deployment configuration will require, at minimum:
- `CRON_SECRET`
- Firestore project/runtime authentication
- `ORBI_NEWS_ORGANIZATION_ID`
- controlled Discovery variables/source registry
- `RESEND_API_KEY`
- `ORBI_NEWS_EMAIL_FROM`
- `ORBI_NEWS_DIGEST_RECIPIENT`
- `ORBI_PUBLIC_BASE_URL`

## Boundaries
NA-14 does not claim that a live Vercel production project is connected in the current session. The visible Vercel connection does not expose the production project hosted under Simón's Vercel environment.

NA-14 also does not treat raw RSS as publishable truth. Live autonomous publication still requires an upstream verification/editorial process to produce an approved CanonicalStory before the publication adapter can write it to `/news`.

## Closure criterion
NA-14 may be declared PASS when TypeScript validation, the full deterministic ORBI News suite and the production build pass with Vercel Cron auth, Discovery Function, public Firestore news store/API, daily digest and web-publication gate tests included.
