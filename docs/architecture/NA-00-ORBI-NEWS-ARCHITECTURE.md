# ORBI News Intelligence — Architecture Baseline

## Current Host Application
The current ORBI website is a React 19 + Vite 6 application with an Express server. ORBI News must extend this codebase without destabilizing existing public functionality.

## Target Logical Layers
1. Public Web UI
2. News Application Services
3. Domain Model
4. Infrastructure Adapters
5. Persistence
6. Scheduling / Background Execution
7. External Providers

## Proposed Repository Layout

```text
src/
  news/
    components/
    pages/
    hooks/
    api/
    types/

domain/
  common/
  news/
  events/
  verification/
  editorial/
  publications/
  policies/
  audit/

lib/
  news/
  verification/
  scoring/
  editorial/
  visuals/
  social/
  email/
  scheduler/
  storage/
  audit/

server/
  news/
  routes/
  jobs/

tests/
  deterministic/
  integration/
  e2e/
```

Directories will be introduced incrementally rather than as empty scaffolding.

## Domain / Infrastructure Rule
The domain layer owns business meaning and invariants. Infrastructure implements interfaces defined by the domain/application layer.

Forbidden dependencies inside domain code include:
- AI SDKs
- HTTP clients
- database clients
- Vercel-specific APIs
- Meta APIs
- email SDKs

## Core Pipeline

```text
DiscoveryCandidate
  -> NewsItem
  -> VerificationRecord
  -> EventRecord
  -> NewsScore
  -> CanonicalStory
  -> WebPublication
  -> SocialPackage
```

## Public Portal Boundary
The public ORBI News portal consumes approved/published canonical stories. It must never render raw discovery results as verified news.

Initial intended public routes:
- /news
- /news/:slug
- /news/category/:category

Routing implementation will follow the host application's existing navigation model until a dedicated router decision is made.

## Server Boundary
The Express server is the trusted runtime for:
- secret-bearing provider calls
- persistence access
- background jobs
- protected editorial/admin endpoints
- social package email delivery

Browser code must not receive private API keys or provider credentials.

## Background Execution
Periodic discovery and processing will be designed as idempotent jobs. Hosting-specific scheduling is an adapter concern. The domain must not assume Vercel Cron directly.

## Persistence
V1 target persistence is a managed relational database suitable for:
- sources
- news items
- events
- verification records
- scoring history
- canonical stories
- social packages
- publications
- audit logs

Generated images and large assets belong in object/blob storage rather than relational rows.

## Publication Authority
No AI completion may directly trigger publication. The flow is:

```text
AI/algorithm recommendation
  -> validated structured candidate
  -> deterministic policy evaluation
  -> authorized state transition
  -> publisher/web publication adapter
```

## Idempotency
Every external publishing or delivery action must have a stable idempotency key. Duplicate requests must not create duplicate publications/emails.

## V1 Channel Model
Primary: ORBI News web portal.
Secondary: Facebook and Instagram via manually published Social Package delivered by email.

Direct Meta publishing is explicitly outside the V1 critical path.

## Multi-tenant Readiness
Core persisted records should carry organizationId where appropriate. V1 may only instantiate ORBI Ecosystem, but the architecture must not make ORBI a hard-coded singleton in domain logic.

## Initial Capabilities
- DATABASE
- AI_ENGINE
- NEWS_DISCOVERY
- WEB_RESEARCH
- VERIFICATION
- EVENT_INTELLIGENCE
- SCORING
- EDITORIAL_GENERATION
- IMAGE_GENERATION
- PUBLIC_NEWS_PORTAL
- SCHEDULER
- EMAIL_DELIVERY
- FACEBOOK_PUBLISHING
- INSTAGRAM_PUBLISHING

Capability state values:
- NOT_CONFIGURED
- AVAILABLE
- DEGRADED
- UNAVAILABLE

## First Engineering Gate
Before connecting any external AI/news/email provider, NA-01 must establish:
- canonical enums
- IDs and timestamps
- Result/error pattern
- News domain
- Event domain
- Verification domain
- Editorial domain
- Publication/social domain
- policy/state transitions
- deterministic tests
