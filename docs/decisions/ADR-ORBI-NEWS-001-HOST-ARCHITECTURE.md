# ADR — ORBI News 001: Extend the existing Vite/React/Express host

## Status
Accepted

## Context
The ORBI Ecosystem corporate website already runs on React, Vite and Express. ORBI News must become a first-class extension of that website while minimizing migration risk.

## Decision
ORBI News will be implemented incrementally inside the existing host architecture. We will not migrate the corporate website to Next.js as a prerequisite for V1.

Business/domain logic will remain framework-independent so it can later be extracted into a separate service or migrated without rewriting editorial rules.

## Consequences
Positive:
- no framework migration blocks ORBI News;
- existing visual identity and corporate functionality remain stable;
- smaller deployment risk;
- faster path to a public /news experience.

Trade-offs:
- SEO/news routing may require additional Express/Vite work compared with a server-first framework;
- background jobs and server APIs must be designed explicitly;
- future scale may justify splitting the agent/backend into a dedicated service.

## Guardrails
- domain code may not import React, Express, Vite, AI SDKs or provider SDKs;
- secret-bearing operations stay server-side;
- production remains unchanged until a dedicated validation gate is passed;
- ORBI News development remains on feature/orbi-news-agent until approved for merge.
