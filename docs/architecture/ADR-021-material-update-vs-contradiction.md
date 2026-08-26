# ADR-021 — Material Update vs Contradiction

Status: Accepted for NA-04.4/NA-04.5.

## Decision

ORBI must distinguish a factual change to an existing event from evidence that contradicts the event narrative. A contradiction must never be downgraded to a normal material update merely because it arrived later in time.

## Material update signals

The following signal classes may represent a material update when sufficiently supported:

- status change
- confirmed event-date change
- price change
- regulatory decision
- incident recovery
- official correction

New context alone is not a material update.

## Contradiction signals

- official denial
- factual contradiction

An authoritative contradiction has precedence over all update signals and is classified as `CONTRADICTION`.

A non-authoritative contradiction is not resolved autonomously as fact. It produces `REQUIRE_HUMAN_REVIEW`.

If material-update and non-authoritative contradiction signals coexist, ORBI returns `REQUIRE_HUMAN_REVIEW` rather than selecting the interpretation that best fits the existing narrative.

## Authority boundary

AI may extract or suggest event-change signals. AI may not decide whether a signal is a material update or contradiction. The deterministic classifier owns that decision.

## Safety invariant

`later information != material update`.

Chronology alone is not evidence that the new information should amend the existing event. An official denial or factual contradiction changes the confidence/interpretation of the event and must remain explicit.

## Consequences

- Event versioning may consume `MATERIAL_UPDATE` signals.
- Contradiction handling may mark an event disputed or route it to human review.
- `NO_MATERIAL_CHANGE` evidence may still be attached as context without creating a new event version.
