# ADR-043 — Editorial Identity Provider and Runtime Mount

## Status
Accepted for NA-08.8.

## Decision
The Editorial Control Center private API uses an explicit server-side identity provider and is mounted only when editorial authentication is configured.

### Runtime configuration
`ORBI_EDITORIAL_AUTH_SECRET` is the activation boundary.

- Missing/blank secret: `/api/editorial` is not mounted.
- Configured secret: the private router is mounted with an HMAC-SHA256 Bearer-token identity resolver.

No secret, token, user record, or administrative credential is committed to the repository.

## Token contract
The internal signed access token contains only:

- `sub`: actor identifier
- `org`: organization identifier
- `role`: canonical `EditorialRole`
- `iat`: issued-at Unix timestamp
- `exp`: expiry Unix timestamp

The payload is Base64URL encoded and authenticated with HMAC-SHA256. The verifier uses constant-time signature comparison, rejects malformed claims, rejects expired tokens, and rejects tokens issued beyond the allowed clock skew.

## Authority boundary
Token verification establishes identity only. It does not authorize editorial actions.

```text
signed identity
  -> organization scope
  -> editorial role
  -> private read API
  -> deterministic action gate (future mutations)
```

All mutation authority remains with State Machine + deterministic editorial/publication gates.

## Tenant isolation
`organizationId` comes from the verified token and is passed to `EditorialQueueReader`. Clients cannot select another organization via request query parameters.

## Runtime mount
`server.ts` calls `mountEditorialPrivateApiIfConfigured(app, process.env)` after the public News API is mounted and before generic application routes.

This helper registers `/api/editorial` only when `ORBI_EDITORIAL_AUTH_SECRET` is present.

## Non-goals
NA-08.8 does not implement:

- login UI
- password storage
- user registration
- refresh tokens
- token issuance endpoint
- external SSO/OIDC
- mutable editorial endpoints
- production persistence for editorial users

The signing helper exists for deterministic tests/tooling only and is not exposed through HTTP.

## Future migration
A future OIDC/SSO provider can replace `EditorialIdentityResolver` without changing the queue, private routes, tenant boundary, or editorial authorization model.
