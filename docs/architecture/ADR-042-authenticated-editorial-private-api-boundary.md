# ADR-042 — Authenticated Editorial Private API Boundary

## Status
Accepted for NA-08.7 implementation. Runtime mount remains intentionally deferred until a real identity provider is configured.

## Context
The Editorial Control Center needs a private read API, but the repository currently has no reusable authentication/session middleware. Mounting an administrative route without an identity provider would create an unsafe boundary.

The existing read service also lacked organization scoping, which could have allowed a future authenticated request to read queue sources outside its tenant.

## Decision
Introduce a provider-neutral editorial identity boundary and make all private editorial reads fail closed.

### Identity contract
An authenticated editorial actor contains:
- `organizationId`
- `actorId`
- `role: EditorialRole | null`

`EditorialIdentityResolver` is injected. The default `notConfiguredEditorialIdentityResolver` returns `null`.

### HTTP behavior
`GET /queue` on the editorial router follows this precedence:
1. no authenticated actor → `401 EDITORIAL_AUTHENTICATION_REQUIRED`
2. authenticated actor without editorial role → `403 EDITORIAL_ROLE_REQUIRED`
3. invalid queue bucket → `400 INVALID_EDITORIAL_QUEUE_BUCKET`
4. valid editorial actor → organization-scoped read service
5. unexpected server failure → `500 EDITORIAL_CONTROL_CENTER_READ_FAILED`

### Tenant isolation
`EditorialQueueReader.listQueueSources` now requires `organizationId`.
`EditorialControlCenterReadService.listQueue` also requires `organizationId`.
The router takes that organization ID only from the authenticated actor, never from a client query parameter.

### Fail-closed composition
`createEditorialPrivateApi()` defaults to:
- `emptyEditorialQueueReader`
- `notConfiguredEditorialIdentityResolver`

Therefore its default behavior is authenticated denial rather than anonymous access or simulated identity.

## Runtime mount
The private router is not mounted in `server.ts` yet. Mounting is deferred until a real identity provider is chosen and wired. This is intentional: an administrative route must not be exposed merely because a placeholder resolver exists.

When mounted, the intended path is:

`/api/editorial` → authenticated private router

and it must remain before SPA fallback middleware.

## Non-goals
NA-08.7 does not add:
- login UI
- JWT/session implementation
- OAuth provider
- mutable editorial endpoints
- publication authority
- bypasses around deterministic gates

## Consequences
The Control Center can now be integrated with any later authentication provider without changing the queue domain model. Tenant isolation is enforced at the read boundary, and the absence of authentication remains an explicit unavailable capability rather than a simulated success.
