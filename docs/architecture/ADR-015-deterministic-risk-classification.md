# ADR-015 — Deterministic verification risk classification

## Status
Accepted.

## Decision
ORBI News classifies verification risk with deterministic code from explicit risk signals. AI or external analysis may suggest signals, but cannot directly set or lower the final `RiskLevel`.

## Severity mapping
- `LOW`: generic/other non-sensitive signal.
- `MEDIUM`: rumor, unverified claim, copyright risk.
- `HIGH`: legal sensitivity, reputational risk, financial claim, security incident, political content, source conflict.
- `CRITICAL`: privacy concern, medical claim, manipulated media.

The highest applicable severity wins.

## Non-downgrade rule
When multiple classifications are merged, the resulting risk level must be the highest level present. Later enrichment may raise risk but cannot silently downgrade an already identified higher risk.

## Consequences
- Risk is explainable through persisted `RiskReason` values.
- Sensitive content automatically raises downstream corroboration and review requirements.
- Model confidence does not override deterministic safety rules.
- New risk categories require an explicit code and ADR update rather than hidden prompt behavior.
