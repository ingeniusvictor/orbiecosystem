# ADR-032 — Visual Generation Result Contract and Full Deterministic Visual Gate

## Status
Accepted for NA-06.9 and NA-06.10.

## Decision
ORBI News normalizes every image provider response into a provider-neutral `VisualGenerationResult` before visual acceptance. Provider availability, failures, dimensions, MIME type, asset location, safety signals and metadata are explicit domain inputs.

## Generation states
- `SUCCEEDED`
- `FAILED`
- `NOT_CONFIGURED`

`NOT_CONFIGURED` is a first-class state. The system must never pretend that image generation is available when no provider is configured.

## Full gate pipeline

```text
CanonicalStory
  -> AI Visual Prompt Contract
  -> VisualGenerationResult
  -> Output completeness check
  -> 16:9 validation
  -> Truth-label validation
  -> Overlay validation
  -> Misrepresentation / safety gate
  -> final visual decision
```

Final decisions:
- `ALLOW`
- `REQUIRE_HUMAN_REVIEW`
- `DEFER`
- `BLOCK`

## Precedence
1. `NOT_CONFIGURED` -> `DEFER`.
2. provider failure -> `DEFER`.
3. a result claiming success but missing required asset metadata -> `BLOCK`.
4. invalid dimensions, overlay or origin/truth-label pair -> `BLOCK`.
5. blocking misrepresentation signal -> `BLOCK`.
6. ambiguous review signal -> `REQUIRE_HUMAN_REVIEW`.
7. only a complete, clean result -> `ALLOW`.

## Safety invariant
A generated visual cannot acquire factual authority by passing the visual gate. The gate validates suitability, representation and technical constraints only. It does not verify claims, sources or events.

## Provider neutrality
The domain retains generic provider/model/request metadata for auditability but does not depend on any specific provider SDK or response schema.

## Storage boundary
The generation result contains an asset reference, not binary image content. Binary assets belong in object/blob storage according to the host architecture.

## Idempotency and retries
Retry orchestration remains an application/infrastructure concern. A provider failure is normalized and deferred; the domain does not implement infinite retries or provider-specific retry rules.

## Consequences
ORBI can switch image providers without changing visual authority rules, and all generated images must traverse the same deterministic acceptance path before becoming canonical visual assets.
