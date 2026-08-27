# ADR-085 — Full Production Runtime Gate

## Status
Accepted — NA-11.9 final gate candidate.

## Decision
NA-11 closes only if the combined production runtime contracts prove these invariants together:

1. Runtime is disabled by default.
2. Enabled production runtime requires durable Firestore.
3. A configured handler alone does not make an action runnable.
4. Matching handler + toggle + capability are all required for `READY`.
5. Kill switches still degrade/block readiness.
6. Missing handlers fail closed and never simulate success.
7. Scheduler transport authentication is mandatory.

## Boundary
A PASS here means the production runtime composition is ready for controlled deployment configuration. It does **not** mean a commercial web-search provider, email provider, Cloud Scheduler job, IAM/OIDC binding, Cloud Run deployment, or autonomous publication has been activated.

External provider activation remains `NOT_CONFIGURED` until credentials, vendor selection, source registry data and deployment infrastructure are supplied explicitly.
