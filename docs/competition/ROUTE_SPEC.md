# Route Specification

This document proposes future routes. It does not implement them.

## Current Routing Context

The repository currently uses a React SPA with Vite and section-based navigation inside `src/App.tsx`. No React Router, file-based routing, CMS routing or route manifest was detected.

## `/`

- Objective: Corporate website for ORBI Ecosystem SpA.
- Audience: General visitors, partners, evaluators and users exploring the ORBI ecosystem.
- Expected sections: Hero, ecosystem overview, differentiators, Foton Prime, divisions, projects, roadmap, CTA, footer.
- Content source: Existing `src/data.ts`, component text and future centralized registries.
- Planned metadata: Corporate title, description, Organization and WebSite structured data.
- Navigation: Existing header section navigation.
- Current status: Implemented as current SPA home.
- Dependencies: Existing React components and static assets.
- Acceptance criteria: Existing public interface remains stable; competition content is not mixed into home without approval.

## `/climate-recovery`

- Objective: Spanish landing page for the AI for Climate Innovation Factory 2026 submission.
- Audience: Competition jury, renewable energy stakeholders and technical reviewers.
- Expected sections: Hero, problem, solution, explainable AI, human supervision, workflow, climate impact categories, product status, company context, CTA.
- Content source: `docs/competition/CONTENT_CANON.md`, `docs/competition/CLAIMS_REGISTER.md` and `src/content/competition.ts`.
- Planned metadata: Climate Recovery title, description, canonical, Open Graph, Twitter/X card, SoftwareApplication structured data.
- Navigation: Future route entry from home or project cards after approval.
- Current status: Proposed only; not implemented.
- Dependencies: Future routing decision compatible with the existing SPA architecture.
- Acceptance criteria: One H1, Spanish language, no invented metrics, no unverified claims, operator decision principle visible.

## `/climate-recovery/en`

- Objective: English version of the Climate Recovery landing page.
- Audience: International jury and English-speaking renewable energy stakeholders.
- Expected sections: Equivalent to `/climate-recovery`, with approved English content.
- Content source: Future approved English canon derived from `CONTENT_CANON.md`.
- Planned metadata: English title, description, canonical/hreflang, Open Graph, Twitter/X card.
- Navigation: Language switch from Spanish route after architecture approval.
- Current status: Proposed only; subject to current SPA architecture.
- Dependencies: i18n or route strategy not yet implemented.
- Acceptance criteria: English copy approved, `hreflang` relationship documented, no unsupported claims.

## `/projects/orbi-pbmetrics`

- Objective: Reusable technical product profile for ORBI PBMetrics IA.
- Audience: Technical evaluators, potential partners and internal product reviewers.
- Expected sections: Product overview, status, intended users, functional scope, AI boundaries, evidence requirements, competition edition relationship, future roadmap labels.
- Content source: `src/content/competition.ts`, `CLAIMS_REGISTER.md` and future product evidence.
- Planned metadata: Product title, description, canonical, Open Graph, SoftwareApplication structured data.
- Navigation: Future project card or route link after approval.
- Current status: Proposed only; not implemented.
- Dependencies: Future route implementation and product status verification.
- Acceptance criteria: Separates company, base product, competition edition and planned functions.

## Route Implementation Rule

Do not create these routes until the routing strategy is approved.
