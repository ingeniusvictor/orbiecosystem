# ADR-030 — Visual Asset Profile and Truth Labels

## Status
Accepted for NA-06.1 through NA-06.5.

## Context
ORBI News will use generated and sourced visuals. A generated image can be useful editorially but must never be represented as photographic evidence of an event. Visual identity also needs to remain consistent across categories without coupling the domain to one image-generation vendor.

## Decision
ORBI News introduces a provider-neutral visual domain with:

- `VisualAsset` as the canonical visual record.
- V1 aspect ratio fixed to `16:9`.
- `ORBI_NEWS_VISUAL_PROFILE_V1` as the base editorial profile.
- deterministic category profiles for every `ContentCategory`.
- `VisualTruthLabel` values:
  - `EDITORIAL_CONCEPT`
  - `TECH_VISUALIZATION`
  - `ILLUSTRATIVE_RENDER`
  - `DOCUMENTARY_EVIDENCE`
- explicit asset origin values separating AI-generated, editorial-provided, licensed and verified documentary material.

## Documentary Evidence Rule
`DOCUMENTARY_EVIDENCE` may only be paired with `VERIFIED_DOCUMENTARY` origin.

An `AI_GENERATED` visual can never use the `DOCUMENTARY_EVIDENCE` label. This rule is deterministic and does not depend on model self-reporting.

## Prompt Contract
The AI visual prompt contract:

- always requests `16:9`;
- applies the ORBI News base profile plus a category-specific profile;
- requires a truth label permitted for generated content;
- requires an overlay phrase of 3–7 words;
- explicitly states that generated material is not documentary evidence;
- restricts named factual entities to those supplied by the upstream verified editorial context;
- prohibits invented quotes, statistics and unsupported factual text.

## Category Profiles
Every canonical ORBI News content category has an explicit visual profile. Category profiles guide subject direction, atmosphere and composition but do not create factual authority.

## Authority Boundary
Visual generation is downstream from verified editorial context.

A visual prompt, image model or generated asset cannot:

- create a verified claim;
- create a verified source;
- convert an illustrative scene into documentary evidence;
- override verification, event or editorial gates.

## Consequences
The visual layer remains portable across providers and safer against misrepresentation. Later NA-06 work can add overlay validation, pixel/aspect validation, safety review and generation-result contracts without changing the factual authority model.
