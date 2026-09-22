# NEWS-ECC-P5 — Publication Authority Review Skill

Status: CONTROLLED / SECOND NEWS PROJECT SKILL

## Skill

`.agents/skills/orbi-news-publication-authority-review/SKILL.md`

## Purpose

Encode ORBI News publication and activation authority so agent recommendations do not become publishing permission.

## Grounding

The skill reflects current repository policy in:

- `domain/publications/policy.ts`;
- `domain/editorial/editorial-gate.ts`;
- `server/news/autonomous-web-publishing-policy.ts`;
- `server/operations/production-runtime-config.ts`;
- ADR-039 Editorial Control Center Authority Model;
- ADR-062 Manual Social Publication Tracker;
- ADR-086 Controlled Production Activation Gate.

## Key invariants

- EDITORIAL ALLOW != PUBLICATION PERMISSION
- OPERATIONAL ALLOW != PUBLICATION AUTHORITY
- RUNTIME READY != ACTIVATION AUTHORIZATION
- WEB_AUTONOMOUS != SOCIAL / EMAIL / IMAGE AUTONOMY
- MODEL OUTPUT != VERIFIED NEWS FACT

## Safety

Instruction-only.
No runtime activation.
No publication.
No threshold change.
No credentials.
No new provider access.
No Agent Kit hooks/MCP/memory/autonomous loops.

## Exit criteria

- skill registered and conditionally routed;
- AgentShield remains baseline-only;
- News ECC PR gate GREEN;
- no runtime/product source changes.
