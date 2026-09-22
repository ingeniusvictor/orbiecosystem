# NEWS-ECC-P6 — ORBI News Agent Harness Contract

Status: CONTROLLED / CONTRACT-DEFINED

## Goal

Adapt the Agent Kit harness pattern to ORBI News without introducing a second runtime-autonomy system.

## Adds

- `.agents/skills/orbi-news-agent-harness/SKILL.md`
- `.orbi/orbi-news-agent-observation-v1.schema.json`
- `scripts/validate-orbi-news-agent-observation.mjs`
- `tests/deterministic/orbi-news-agent-harness-contract.test.ts`

The harness test is automatically included by the existing `npm run test:orbi-news` glob.

## Explicit authority impact

Every observation reports booleans for:

- production activation profile;
- runtime enabled state;
- autonomy level;
- automation toggles;
- kill switches;
- canonical factual claims;
- web publication;
- social publication;
- secret/provider configuration.

The validator checks shape only. It does not authorize these actions or prove evidence true.

## Safety

No new ORBI News product autonomy.
No runtime activation.
No publication.
No provider/secret writes.
No hooks/MCP/memory/Agent Kit autonomous loops.

## Exit criteria

- new harness tests PASS within `test:orbi-news`;
- TypeScript PASS;
- production build PASS;
- AgentShield has no new finding class.
