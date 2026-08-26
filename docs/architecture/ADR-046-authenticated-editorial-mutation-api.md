# ADR-046 — Authenticated Editorial Mutation API

## Status
Accepted for NA-08.11.

## Context
The Editorial Control Center now has a deterministic mutation command layer, but the browser must not call it directly or provide trusted identity fields. A private HTTP boundary is required before mutation controls can be enabled.

## Decision
Expose one authenticated command endpoint inside the existing private editorial API:

`POST /api/editorial/stories/:storyId/actions`

Accepted request body fields:
- `action`
- `expectedRevision` (optional)
- `reason` (optional, max 500 characters)

Identity fields are never accepted as authority from the request body. `actorId`, `organizationId`, and `EditorialRole` come exclusively from `EditorialIdentityResolver`.

## Authorization order
1. Resolve authenticated actor.
2. Missing identity -> HTTP 401.
3. Missing editorial role -> HTTP 403.
4. Missing mutation persistence/service -> HTTP 503 `EDITORIAL_MUTATION_NOT_CONFIGURED`.
5. Validate story id and request payload.
6. Invoke `EditorialMutationCommandService` with actor identity from the verified resolver.
7. Return deterministic result mapping.

## Result mapping
- Success -> 200.
- Story not found in actor organization -> 404.
- Stale client revision -> 409.
- Concurrent modification -> 409.
- Deterministic action denial -> 403.
- Mutation contract/validation failure -> 422.
- Unexpected route/runtime failure -> 500.

## Fail-closed persistence behavior
The runtime mount may authenticate the editorial API before a real `EditorialMutationUnitOfWork` exists. In that state, read endpoints remain available according to configured readers, but mutation requests return HTTP 503. No in-memory production mutation fallback is created.

## Security properties
- Client-supplied `actorId`, `organizationId`, or `role` cannot override authenticated identity.
- The server re-evaluates authorization through the fresh command-layer snapshot.
- Optimistic revision checks protect against stale UI actions and races.
- Mutation and AuditLog persistence remain an atomic Unit of Work responsibility.
- No direct transition to `PUBLISHED` is performed by `PUBLISH_WEB_NOW`; it only starts `PUBLISHING`.

## Non-goals
NA-08.11 does not:
- connect a production database;
- expose login/token issuance;
- enable React mutation buttons;
- implement external web publishing;
- implement retry orchestration.

## Consequence
The UI can later enable only actions already authorized by the domain, but the server remains the final authority and re-checks every command with authenticated identity and fresh state.
