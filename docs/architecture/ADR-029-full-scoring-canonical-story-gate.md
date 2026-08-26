# ADR-029 — Full Scoring + Canonical Story Gate

## Status
Accepted

## Context
NA-05 introduced deterministic editorial scoring, Breaking News eligibility, the grounded CanonicalStory builder, source attribution rules and an integrated editorial gate. The final closure requirement is to prove that these parts compose safely end-to-end without letting editorial desirability override verification, event dispute state or grounding failures.

## Decision
The full NA-05 flow is treated as a deterministic composition:

Verified Event / Verification Authority
→ ORBI Editorial Score
→ Breaking Eligibility
→ CanonicalStory Builder
→ Grounding Assessment
→ Integrated Editorial Gate
→ Final Editorial Decision

The final editorial outcomes remain:

- `ALLOW_EDITORIAL`
- `REQUIRE_HUMAN_REVIEW`
- `DEFER`
- `BLOCK`

## Authority precedence
Editorial score never establishes factual authority.

The following conditions override a high ORBI score:

1. verification gate `BLOCK`;
2. invalid canonical grounding;
3. critical risk;
4. invalid event state;
5. canonical story policy failure;
6. event contradiction or dispute, which requires human review unless another blocking condition is present.

A score in the HOLD range does not mean false or rejected. It means the story should not advance yet and therefore resolves to `DEFER` when stronger blocking or review conditions are absent.

## Breaking News invariant
`BREAKING_CANDIDATE` is only a scoring band. Breaking eligibility additionally requires all deterministic conditions defined in the Breaking policy, including VERY_HIGH verification confidence, LOW risk, verification permission, resolved event state, no contradiction and the required social score.

Therefore:

`ORBI_SCORE >= 93` does not imply Breaking News.

## Grounding invariant
The CanonicalStory builder guarantees declared provenance by requiring verified claim keys and verified source keys. A later grounding assessment may still reject the semantic faithfulness of generated prose. If grounding is invalid, the integrated editorial gate returns `BLOCK` regardless of editorial score.

## Test closure
NA-05 is considered complete only when deterministic tests prove at minimum:

- a fully verified, grounded, high-value story can reach `ALLOW_EDITORIAL`;
- a valid Breaking candidate can satisfy Breaking eligibility only when every required gate passes;
- invalid grounding blocks even with very high editorial score;
- disputed/contradicted events require human review and are not Breaking eligible;
- HOLD score defers rather than publishes;
- verification BLOCK remains authoritative over editorial desirability.

## Consequences
ORBI News can now move from verified event intelligence into controlled editorial creation without conflating popularity, relevance or AI-generated prose with truth authority. The next phase may focus on visual intelligence while consuming only stories that have passed the editorial gate or are explicitly routed for human review.
