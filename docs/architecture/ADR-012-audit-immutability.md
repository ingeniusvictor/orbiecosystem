# ADR-012 — Audit Log Immutability and Actor Traceability

## Status
Accepted for ORBI News Intelligence V1.

## Decision
Every material lifecycle action in ORBI News Intelligence must append an immutable audit entry. Audit history is append-only and must never be rewritten to hide or replace prior actions.

## Required traceability
Each audit entry records:
- organization
- entity type and entity id
- action
- actor type and actor id
- state transition when applicable
- policy decision and rule when applicable
- error details when applicable
- correlation id when available
- event timestamp in UTC

## Actor classes
- HUMAN
- AI
- SYSTEM
- CRON
- EXTERNAL_API

AI may generate drafts, scores, classifications and recommendations, but AI cannot be represented as the final approver of content.

## Correlation
A correlation id should connect the full execution chain for one operation, for example:
Discovery run -> verification -> event resolution -> scoring -> canonical story -> publication attempt.

## Security
Audit metadata must not contain secrets, passwords, API tokens or unnecessary personal data.

## Consequence
A published story can be reconstructed later to answer: what source entered the system, how it was verified, what decisions were taken, which actor performed them, and how publication succeeded or failed.
