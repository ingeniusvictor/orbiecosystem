# ADR-080 — Authenticated Scheduler Invocation Transport

## Status
Accepted — NA-11.4 PASS candidate.

## Decision
Cloud Scheduler-style invocations enter ORBI News through a server-only authenticated POST transport. The caller may provide only `job` and, for `BREAKING_SOCIAL`, `breakingEligible`.

The server derives the canonical `OperationalAction`, current UTC timestamp, authority snapshot, organization and worker identity. Caller-supplied action/identity/authority fields are ignored.

A server-side scheduler token of at least 32 characters is required and compared with `timingSafeEqual`. This token is defense-in-depth for the application transport and does not replace Cloud Run IAM/OIDC in deployment.

## Safety properties
- Unauthorized requests never invoke runtime logic.
- The scheduler cannot choose a more privileged action than the canonical job mapping.
- Breaking eligibility is forbidden for non-breaking jobs.
- The caller cannot select autonomy, capabilities, toggles, worker or organization.
- Responses expose operational outcome metadata but no secret values.

## Non-goals
No Cloud Scheduler job, IAM binding, OIDC service account or Cloud Run deployment is created in this phase.
