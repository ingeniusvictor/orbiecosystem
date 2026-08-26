# ADR-039 — Editorial Control Center Authority Model

## Status
Accepted for NA-08.1 through NA-08.4.

## Context
The Editorial Control Center needs to expose operational controls without becoming a second source of truth for publication, Breaking status, or editorial approval.

ORBI News already has deterministic authorities for state transitions, integrated editorial eligibility, Breaking eligibility, and publication state. The private UI must consume those authorities rather than recreate or override them.

## Decision
Introduce a vendor- and UI-neutral editorial control contract in `domain/editorial/control-center.ts`.

Roles are:
- `OWNER`
- `EDITOR`
- `REVIEWER`
- `VIEWER`

Mutating actions are:
- request revision
- approve story
- reject story
- mark/unmark Breaking
- prepare web publication
- request immediate web publication

A role permission is necessary but never sufficient. Every action is also evaluated against the canonical story state machine, publication state machine, integrated editorial gate, and Breaking eligibility result where applicable.

`OWNER` has the broadest permission set but cannot bypass deterministic blocks. `EDITOR` cannot request immediate publication. `VIEWER` has no mutating actions.

## Invariants
1. The UI does not grant authority by rendering a button.
2. `OWNER` cannot bypass Editorial Gate, Breaking Eligibility, or State Machine.
3. Breaking is enabled only after explicit `BreakingEligibilityResult.eligible === true` and `ALLOW_EDITORIAL`.
4. Immediate web publication requires an approved story, a publication state that can transition to `PUBLISHING`, an allowed Editorial Gate, and the `OWNER` role.
5. Published canonical stories cannot be sent back to drafting through the Control Center.
6. Available actions are derived deterministically from the current snapshot and role.
7. This contract authorizes requests only; the backend remains responsible for executing state changes and writing audit records.

## Consequence
NA-08 UI and API layers can render the same action model without duplicating editorial authority. Future authentication providers may map identities to these roles without changing domain rules.
