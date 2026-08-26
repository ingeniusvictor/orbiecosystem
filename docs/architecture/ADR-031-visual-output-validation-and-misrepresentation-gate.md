# ADR-031 — Visual Output Validation and Misrepresentation Gate

## Status
Accepted

## Context
NA-06.1 through NA-06.5 define the visual asset model, ORBI visual profiles, prompt contract, and truth labels. Those controls constrain what ORBI asks an image generator to produce, but generated output still requires deterministic validation before it can become an accepted ORBI News asset.

Prompt compliance is not assumed. A provider can return unexpected dimensions, render unsupported text, or produce imagery that visually resembles documentary evidence even when the prompt asked for an editorial concept.

## Decision
ORBI validates visual output independently of the generation provider.

### Overlay rules
The accepted overlay must:
- contain 3 to 7 words;
- contain at most 60 Unicode code points;
- contain no URL;
- contain no line break;
- be normalized for surrounding/repeated whitespace.

These are deterministic output constraints. They do not authorize new factual claims.

### 16:9 validation
V1 accepts only positive integer image dimensions with an exact 16:9 ratio.

The validation uses integer cross multiplication:

```text
width * 9 === height * 16
```

No provider-declared aspect ratio string can substitute for validation against returned dimensions.

### Visual safety signals
Blocking signals include:
- fabricated documentary scene;
- unsupported quote or statistic;
- deceptive product/UI screenshot;
- false event location or scene;
- misleading before/after representation.

Review-only signals include:
- unverified depiction of a real person;
- unsupported brand/logo usage;
- sensational emergency treatment.

### Gate precedence
The deterministic gate applies this precedence:

1. invalid origin/truth-label pair -> BLOCK;
2. invalid dimensions -> BLOCK;
3. invalid overlay -> BLOCK;
4. blocking misrepresentation signal -> BLOCK;
5. review-only signal -> REQUIRE_HUMAN_REVIEW;
6. otherwise -> ALLOW.

A review-only signal cannot downgrade an existing blocking condition.

## Consequences
- A generated image is not trusted merely because generation succeeded.
- A visual can be rejected while its CanonicalStory remains editorially valid.
- Exact dimensions are validated independently from prompt instructions.
- AI-generated documentary evidence remains prohibited.
- Visual safety remains provider-neutral and testable without image-provider SDKs.
- Detection of visual safety signals may later come from deterministic metadata checks, image analysis, human review, or a combination, but the final gate decision remains policy-owned.

## Non-goals
This ADR does not select an image-generation provider, perform image-generation calls, or implement semantic computer vision. NA-06.9 will define the provider result contract and NA-06.10 will integrate the full deterministic visual gate.
