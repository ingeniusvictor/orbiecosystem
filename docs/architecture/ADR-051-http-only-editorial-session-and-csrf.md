# ADR-051 — HttpOnly Editorial Session and CSRF Boundary

## Status
Accepted for NA-08.15A.

## Context
The Editorial Control Center already supported signed HMAC bearer tokens, but the browser UI intentionally did not store those credentials in source code or `localStorage`. A browser-native session mechanism is required before the private UI can operate without exposing the credential to JavaScript.

## Decision
Add an opt-in bootstrap session based on the existing signed editorial access-token format.

### Runtime configuration
A bootstrap session is configured only when all of the following are present:

- `ORBI_EDITORIAL_BOOTSTRAP_ACCESS_KEY`
- `ORBI_EDITORIAL_BOOTSTRAP_ACTOR_ID`
- `ORBI_EDITORIAL_BOOTSTRAP_ORGANIZATION_ID`
- `ORBI_EDITORIAL_BOOTSTRAP_ROLE`

Optional:

- `ORBI_EDITORIAL_SESSION_TTL_SECONDS` (default 8 hours, maximum 24 hours)

The bootstrap access key must be at least 24 characters. Partial configuration fails closed.

### Session cookies
Successful `POST /api/editorial/session` issues two `SameSite=Strict` cookies scoped to `/api/editorial`:

1. `orbi_editorial_session`
   - signed HMAC editorial access token
   - `HttpOnly`
   - `Secure` in production
   - unavailable to application JavaScript

2. `orbi_editorial_csrf`
   - random 256-bit CSRF token
   - readable by same-origin JavaScript
   - `Secure` in production

No Google Cloud credentials or Firestore credentials are involved in browser authentication.

### Identity precedence
The combined identity resolver uses:

1. explicit `Authorization: Bearer ...`
2. HttpOnly editorial session cookie as fallback

This preserves API/tooling compatibility while enabling browser sessions.

### CSRF
Cookie-authenticated state-changing editorial requests must send:

- the `orbi_editorial_csrf` cookie, and
- an identical `X-ORBI-EDITORIAL-CSRF` header.

The values are compared in constant time.

Bearer-authenticated API requests do not require the browser CSRF token because the authorization credential is supplied explicitly rather than ambiently by the browser.

`DELETE /api/editorial/session` is also CSRF-protected when a session cookie is present.

### Session endpoints
- `POST /api/editorial/session` — bootstrap login
- `GET /api/editorial/session` — inspect current cookie session
- `DELETE /api/editorial/session` — logout and clear both cookies

When bootstrap session configuration is absent, login returns `503 EDITORIAL_SESSION_NOT_CONFIGURED`; existing bearer authentication remains available.

## Security invariants
1. Browser JavaScript cannot read the signed session credential.
2. Session cookies are `SameSite=Strict`.
3. Production session cookies are `Secure`.
4. Mutation authorization is still re-evaluated server-side after authentication.
5. CSRF validation is additional protection; it does not replace role, state-machine, editorial-gate, revision, or audit checks.
6. The client cannot choose `actorId`, `organizationId`, or `EditorialRole` after login.
7. Bootstrap credentials live only in server environment configuration and must never be committed.

## Non-goals
This bootstrap mechanism is not a multi-user identity-management system, SSO provider, password-reset workflow, or organization directory. A future external identity provider can replace bootstrap login while retaining the same `EditorialIdentityResolver` contract.
