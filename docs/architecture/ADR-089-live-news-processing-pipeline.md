# ADR-089 — Live News Processing Pipeline

## Status
Accepted — NA-15 CLOSED / PASS.

## Context
NA-14 established Vercel-native scheduling, durable public news storage, public API routes, daily digest delivery and a gate-protected web publication adapter. NA-15 closes the remaining application-level gap: convert a live DiscoveryCandidate into a grounded CanonicalStory, route unsafe/uncertain stories to review, and permit only narrowly defined low-risk stories to publish autonomously when the operator explicitly enables the WEB_AUTONOMOUS profile.

## Decision
NA-15 uses the existing ORBI deterministic contracts rather than creating another autonomous subsystem.

### Live processing order
1. Vercel Discovery Cron persists candidates from the configured RSS Source Registry.
2. Vercel Processing Cron reads only candidates without durable processing receipts.
3. `createLiveArticleFetcher` retrieves the discovered article through an HTTPS host allowlist, bounded redirects, timeout and response-size limits.
4. Gemini 3.7 Flash may research with Google Search grounding and propose structured evidence/editorial content.
5. `createLiveResearchProvider` independently rejects evidence URLs whose domains are absent from the ORBI Source Registry.
6. Primary-source authority is resolved only through the deterministic `resolvePrimarySource` contract.
7. Integrated Verification Gate evaluates research sufficiency, corroboration, contradictions, confidence and risk.
8. Deterministic ORBI editorial score is calculated.
9. CanonicalStory Builder accepts only declared verified claims and verified source keys.
10. Integrated Editorial Gate runs before the story can become `DRAFT_READY`.
11. A valid draft is persisted in the existing Editorial Control Center as `READY_FOR_REVIEW`.
12. A durable processing receipt prevents the same candidate from being researched repeatedly.

## Controlled activation profiles
NA-15 retains exact allow-list activation rather than minimum permission sets.

### EDITORIAL_ASSISTED
- SystemMode NORMAL
- Autonomy LEVEL_3
- AUTO_DISCOVERY
- AUTO_VERIFICATION
- AUTO_DRAFT
- discovery/research/verification/event/scoring/editorial capabilities only
- no autonomous web publication, email, image or social publication

### WEB_AUTONOMOUS
WEB_AUTONOMOUS is explicit operator authorization, not model-granted authority.

It requires exact LEVEL_5 authority for:
- discovery;
- verification;
- draft generation;
- ORBI Web publication.

It still does not enable email automation, image generation, Facebook publication or Instagram publication.

A story may cross the deterministic autonomous web policy only when all conditions are true:
- LOW risk;
- VERY_HIGH verification confidence;
- ORBI score >= 75;
- at least one eligible primary source;
- at least two independent HTTPS source hostnames;
- non-breaking content;
- previous Verification and Editorial Gates have allowed the story;
- Operational Authority allows `PUBLISH_WEB`;
- Publication Gate also allows publication.

If any condition is absent, the story remains in the Editorial Control Center for human review and is not written to the public news store.

## Gemini authority boundary
Gemini is a research and synthesis provider only. The default live research model is `gemini-3.7-flash`, configured through server-side environment variables. Google Search grounding supplies current web context, but:
- the model is never treated as a source;
- model-returned URLs do not count unless they resolve to configured Source Registry domains;
- the model cannot enable capabilities or toggles;
- the model cannot bypass Verification or Editorial Gates;
- the model cannot select the production activation profile;
- the model does not directly write the public news store.

No Gemini API key is committed to the repository.

## Network boundary
`createLiveArticleFetcher`:
- requires HTTPS;
- requires an explicit hostname allowlist;
- allows subdomains only below an allowlisted parent;
- handles redirects manually;
- validates every redirect destination against HTTPS + the same allowlist;
- bounds redirects;
- applies timeout and response-size limits;
- accepts HTML/XHTML only;
- strips executable/non-content markup;
- fails closed on insufficient article text.

## Vercel cadence
The Vercel-native path is:
- minute 00: `/api/cron/orbi-news-discovery`
- minute 10: `/api/cron/orbi-news-process`
- minute 15: `/api/cron/orbi-news-digest`

The digest route still performs its own `America/Santiago` 09:00 delivery gate and only includes stories already present in the public ORBI Web store.

## Persistence and idempotency
Durable Firestore state includes:
- discovery candidates;
- operational leases and run ledger;
- live-processing receipts;
- existing Editorial Control Center story documents;
- public `publishedArticles`;
- daily digest receipts.

Exact candidate replay is prevented by live-processing receipts. Public article replay remains protected by the existing public-news writer and publication service.

## Full gate
NA-15 final deterministic coverage proves:
- unknown/unregistered evidence cannot count as verification evidence;
- an eligible primary source is required by deterministic source policy;
- authoritative contradiction prevents autonomous publication;
- HIGH/CRITICAL and other review-required states cannot auto-publish;
- MEDIUM risk fails the stricter autonomous web policy and remains for review;
- breaking stories are excluded from autonomous web publication;
- LOW + VERY_HIGH + score >=75 + primary + independent corroboration can publish under WEB_AUTONOMOUS;
- insufficient operational authority still defers publication;
- a published story is written to the public ORBI News store and reflected as PUBLISHED in editorial persistence;
- candidate receipts prevent repeat research;
- article redirects cannot escape the trusted host allowlist.

Final validation: TypeScript, the complete deterministic ORBI News test suite and production build all passed in GitHub Actions run `33099110892`.

## External activation boundary
NA-15 closes the application code path but does not claim live production activation. Real operation still requires external server-side configuration in the actual Vercel production project, including Firestore credentials/access, Source Registry configuration, `CRON_SECRET`, Gemini API key, Resend configuration and the final controlled activation profile. No production deployment or secret mutation is performed by this ADR.
