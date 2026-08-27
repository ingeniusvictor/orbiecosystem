# ADR-089 — Live News Processing Pipeline

## Status
Accepted — NA-15 in progress.

## Context
NA-14 established Vercel-native scheduling, durable public news storage, public API routes, daily digest delivery and a gate-protected web publication adapter. The remaining gap is converting a live DiscoveryCandidate into a grounded CanonicalStory without treating RSS, a web page, or an AI model as publication authority.

## Decision
NA-15 introduces one composition root, `createLiveNewsProcessingPipeline`, rather than another autonomous subsystem.

The pipeline accepts a live candidate and an injected research provider. The provider may use live web research and AI services, but its result is only evidence/proposal input. Deterministic ORBI contracts remain authoritative.

Execution order:
1. validate candidate identity and HTTPS URL;
2. invoke the research provider;
3. validate organization/event identity consistency;
4. run the integrated Verification Gate;
5. stop on BLOCK, DEFER or HUMAN_REVIEW before story generation;
6. calculate the deterministic ORBI editorial score;
7. build CanonicalStory only from declared verified claims and verified sources;
8. run the integrated Editorial Gate;
9. return `DRAFT_READY` only when the Editorial Gate returns ALLOW.

`DRAFT_READY` does not mean APPROVED or PUBLISHED. NA-15 does not invent a model-owned approval transition.

## Live article retrieval
`createLiveArticleFetcher` provides the first real web-retrieval primitive for NA-15. It:
- requires HTTPS;
- requires an explicit hostname allowlist derived from trusted source configuration;
- allows subdomains only under an allowlisted parent host;
- applies request timeout and response-size limits;
- accepts HTML/XHTML only;
- strips script/style/noscript/comment markup before returning readable text;
- fails closed on insufficient text.

This boundary reduces SSRF and arbitrary-fetch exposure. Redirect destination validation remains a deployment debt because the Fetch API follows redirects internally; production research composition must either disable/fence redirects or validate final destinations before trusting retrieved content.

## Authority boundary
The research provider cannot:
- mark verification as allowed by itself;
- bypass corroboration requirements;
- bypass event readiness;
- mint an approved story;
- publish to ORBI Web;
- alter operational toggles, kill switches, budgets or capabilities.

## Current NA-15 debts
1. No concrete live research provider is wired yet to generate VerificationRecord + corroborating ResearchEvidenceDescriptor from multiple internet sources.
2. No concrete Gemini editorial proposal provider is wired yet.
3. Discovery candidates are not yet dequeued from Firestore into this pipeline automatically.
4. DRAFT_READY persistence/review queue composition is not yet wired.
5. No automated APPROVED transition is introduced; existing editorial control remains authoritative.
6. Redirect target validation must be strengthened before live production fetches.

## Gate
NA-15 will close only after a deterministic full gate proves that a real source-registry candidate can be retrieved, researched with independent evidence, gated, converted to a grounded draft, persisted for editorial control, and never published without the existing approval/publication contracts.
