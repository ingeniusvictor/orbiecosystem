# ADR-044 — Private Editorial Control Center UI

## Status
Accepted for NA-08.9.

## Context
NA-08.1 through NA-08.8 established editorial roles, deterministic action authority, queue/read models, a private API boundary, organization scoping and a conditionally mounted authenticated runtime. The next layer must render that information without introducing a second policy engine in the browser or implying that a visible control has publication authority.

## Decision
The private editorial console is exposed at `/editorial` and consumes `/api/editorial/queue` through an authenticated repository abstraction.

The UI:
- renders derived queue buckets and operational metadata;
- renders risk, verification confidence and ORBI score;
- shows human-attention reasons supplied by the read model;
- renders every action from `actionAssessments` rather than recomputing permissions;
- distinguishes domain-authorized actions from blocked actions;
- keeps all editorial mutation controls disabled in NA-08.9;
- treats missing auth, 401, 403, malformed responses and server failures as distinct states;
- never renders partial invalid queue payloads;
- marks the route `noindex,nofollow` and excludes it from the public SEO route list.

## Token handling
The browser repository accepts an injected `EditorialTokenProvider`. The default provider returns no token and therefore performs no network request. NA-08.9 does not persist bearer credentials in source code or localStorage and does not add a login/token issuing endpoint.

A later session/login integration may inject a token provider without changing the UI contract.

## Authority boundary
A button shown as domain-authorized means only that the deterministic backend/domain model currently allows that action for the actor role and snapshot. It does not execute the action in NA-08.9.

Mutation authority remains future backend orchestration:

`authenticated actor + role + current state + deterministic gates + audit -> mutation`

The UI is not an authority source.

## SEO and privacy
`/editorial` uses `robots=noindex,nofollow`. This is defense in depth only; confidentiality continues to depend on server-side authentication and authorization.

## Consequences
The visual Control Center can be implemented and tested before mutable editorial endpoints exist, without weakening the security model or duplicating editorial policy in React.
