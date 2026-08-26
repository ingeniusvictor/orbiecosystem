# ADR-019 — Full Verification Gate

Status: Accepted for NA-03.10.

## Decision

ORBI News closes NA-03 with one deterministic verification authority composed from the verification record, research progress, corroboration policy, primary-source policy, risk classification and technical-failure policy.

No single intermediate signal is sufficient to authorize editorial progression.

## Final outcomes

The verification authority may return only:

- `ALLOW_EDITORIAL_PIPELINE`
- `REQUIRE_HUMAN_REVIEW`
- `DEFER`
- `BLOCK`

## Precedence

1. Critical risk -> `BLOCK`.
2. Authoritative contradiction -> `REQUIRE_HUMAN_REVIEW`.
3. Exhausted autonomous research budget -> `REQUIRE_HUMAN_REVIEW`.
4. Incomplete research -> `DEFER`.
5. Missing corroboration or required eligible primary source -> `DEFER`.
6. High risk, partial verification or insufficient confidence -> `REQUIRE_HUMAN_REVIEW`.
7. Only a fully satisfied low/medium-risk case may reach `ALLOW_EDITORIAL_PIPELINE`.

## Technical failure invariant

Provider failures are not evidence.

- total timeout without usable evidence -> `DEFER`;
- provider not configured -> `DEFER`;
- partial failure with usable evidence -> `REQUIRE_HUMAN_REVIEW`;
- no failure path may produce `ALLOW_EDITORIAL_PIPELINE`.

## High-risk examples

Financial, political, security, legal and reputational claims require human review even when verification evidence is otherwise strong.

Medical claims, privacy concerns and manipulated media are classified as critical in V1 and therefore blocked from autonomous editorial entry.

## Safety invariant

`VERIFIED` is necessary but not sufficient.

A story can advance autonomously only when research completion, corroboration, eligible source requirements, risk policy and confidence policy all agree.

## NA-03 completion gate

NA-03 is complete only when deterministic end-to-end tests cover normal allow, high-risk review, critical block, authoritative contradiction, incomplete research, total timeout and partial provider failure, and the repository CI passes the complete ORBI News deterministic suite.
