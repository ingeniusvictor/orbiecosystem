# ADR-020 — Event Fingerprint and Resolution Authority

Status: Accepted for NA-04.1–NA-04.3.

## Decision

ORBI News resolves article-level inputs into event-level candidates using deterministic fingerprinting and deterministic similarity scoring. AI may propose semantic fields such as primary entity, event type, subject, secondary entities, location, or update signals, but AI does not decide the final event resolution outcome.

## Fingerprint

An event fingerprint contains:

- primary entity
- event type
- subject
- UTC calendar date bucket when known
- normalized secondary entities
- location
- stable fingerprint hash

Text fields are normalized for whitespace and case. Secondary entities are deduplicated and sorted so equivalent inputs generate the same fingerprint.

The fingerprint is a matching aid, not proof that two records describe the same real-world event.

## Similarity score

V1 uses a deterministic weighted score from 0 to 100:

- primary entity: 35
- event type: 25
- subject: 15
- date bucket: 10
- secondary entity overlap: 10
- location: 5

## Resolution thresholds

- exact hash or score >= 85 -> `SAME_EVENT`, unless an explicit material-update signal exists
- exact hash or score >= 85 plus explicit material-update signal -> `MATERIAL_UPDATE`
- score 60–84 -> `RELATED_EVENT`
- score 40–59 -> `UNRESOLVED`
- score < 40 -> `NEW_EVENT`

When no candidate events exist, the outcome is `NEW_EVENT`.

## Material updates

High similarity alone must not create `MATERIAL_UPDATE`. A material-update outcome requires an explicit update signal from an upstream deterministic or reviewed extraction step. Examples may include a newly confirmed date, official launch, corrected number, newly announced price, changed regulatory status, or incident recovery.

## Authority

The resolver output is a proposed event resolution that must later pass the Event Resolution Policy before persistence. A model-generated recommendation cannot directly merge events or create event versions.

## Safety

The system prefers `RELATED_EVENT` or `UNRESOLVED` over an unjustified merge. False merging can contaminate verification provenance and cause incorrect canonical stories, so ambiguous matches must remain distinguishable.
