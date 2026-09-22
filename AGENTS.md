# AGENTS.md — ORBI Ecosystem Corporate Website

## Product identity

Official company: ORBI Ecosystem SpA

Website: https://orbiecosystem.vercel.app/

Headquarters: Rancagua, Chile

Founded: 2026

Competition product: ORBI PBMetrics IA — Climate Recovery Edition

Competition: AI for Climate Innovation Factory 2026

Category: Renewable Energy Integration and Efficiency

## Permanent rules

1. Preserve the existing ORBI visual identity.
2. Do not replace the corporate ecosystem positioning with a single-product identity.
3. Do not publish invented metrics, customers, pilots, partnerships or climate results.
4. Label estimates, simulations and future capabilities.
5. Do not claim definitive AI diagnoses.
6. Keep the operator as final decision-maker.
7. Never expose secrets, private data or proprietary algorithms.
8. Do not modify production directly.
9. Run all available QA before completion.
10. Maintain accessibility and responsive behavior.
11. Avoid unnecessary dependencies.
12. Reuse existing design system and components.
13. Store competition content in dedicated routes and registries.

## Required workflow

Before editing:

- Inspect the relevant files.
- Report the intended file set.
- Confirm there are no unrelated changes.
- Explain the implementation plan before modifying files.
- Stop if the working tree contains unidentified changes.

After editing:

- Show git status.
- Summarize every modified file.
- Run the available typecheck, lint, tests and build commands.
- Report literal errors and warnings.
- Separate pre-existing failures from newly introduced failures.
- Confirm that no secrets, personal data or invented claims were added.

## Required reading

Before implementing competition modules, read:

- docs/competition/COMPETITION_BRIEF.md
- docs/competition/CONTENT_CANON.md
- docs/competition/CLAIMS_REGISTER.md
- docs/competition/ROUTE_SPEC.md
- docs/competition/QA_CHECKLIST.md

If one of these documents does not exist yet, report it instead of inventing its content.

## Git and deployment rules

- Never work directly on main or the production branch.
- Use the competition/ai-climate-innovation-2026 branch.
- Do not use force push.
- Do not rewrite Git history.
- Do not deploy automatically to production.
- All changes must pass through a Pull Request and Vercel Preview.
- Production deployment requires explicit approval.

## Content rules

- Company name: ORBI Ecosystem SpA.
- Public headquarters: Rancagua, Chile.
- Founded: 2026.
- Product: ORBI PBMetrics IA.
- Edition: Climate Recovery Edition.
- Competition: AI for Climate Innovation Factory 2026.
- Category: Renewable Energy Integration and Efficiency.
- Human principle: The AI recommends; the operator decides.

Never invent:

- Customers.
- Active pilots.
- Partnerships.
- Investment figures.
- Energy recovery percentages.
- CO2 reduction figures.
- Awards.
- Ratings.
- Product capabilities not verified in the repository.

Label content as applicable:

- Existing.
- Prototype.
- Planned.
- Competition Edition.
- Synthetic Data.
- Estimate.
- Simulation.
- Projection.

## Privacy and security

Never expose:

- Environment variable values.
- API keys.
- Tokens.
- Passwords.
- RUT.
- Personal addresses.
- Personal phone numbers.
- Private customer information.
- Proprietary algorithms.
- Internal administrative routes.

## Scope control

Only modify files directly required by the current module.

Do not:

- Refactor unrelated files.
- Replace the existing design system.
- Add dependencies without justification.
- Change canonical texts without approval.
- Modify unrelated routes.
- create fake forms or non-functional buttons.

When the requested change requires files outside the stated scope, stop and explain why before continuing.

---

# ORBI News — scoped engineering governance

This section applies when the task touches ORBI News surfaces such as:

- `domain/news/**`
- `domain/discovery/**`
- `domain/verification/**`
- `domain/editorial/**`
- `domain/visuals/**`
- `domain/publications/**`
- `domain/operations/**`
- `server/news/**`
- `server/editorial/**`
- `server/operations/**`
- `api/**`
- `orbi-news-runtime.ts`
- ORBI News deterministic tests and staging configuration.

The corporate/competition rules above remain in force. This section adds News-specific rules and resolves branch scope for News work.

## ORBI News active development line

For ORBI News work:

- canonical development base: `staging/orbi-news-vercel`;
- use an isolated feature branch and Pull Request into that branch;
- do not work directly on `main`;
- do not deploy production automatically.

The earlier instruction to use `competition/ai-climate-innovation-2026` continues to apply to competition modules. It is not the ORBI News development branch.

## Existing safe runtime defaults

Preserve the production defaults:

```text
ORBI_NEWS_RUNTIME_ENABLED=false
ORBI_NEWS_SYSTEM_MODE=MAINTENANCE
ORBI_NEWS_AUTONOMY_LEVEL=LEVEL_0
```

Do not raise autonomy, change activation profile, enable toggles/capabilities, disable kill switches, increase budgets, or configure production credentials as a side effect of code/documentation work.

## Authority boundaries

Preserve these distinctions:

```text
DISCOVERY != VERIFICATION
SOURCE FETCHED != SOURCE TRUSTED
VERIFICATION GATE PASS != ABSOLUTE FACTUAL TRUTH
MODEL OUTPUT != VERIFIED NEWS FACT
OPERATIONAL ALLOW != PUBLICATION AUTHORITY
RUNTIME READY != ACTIVATION AUTHORIZATION
EDITORIAL ALLOW != WEB OR SOCIAL PUBLICATION PERMISSION
WEB_AUTONOMOUS != SOCIAL EMAIL OR IMAGE AUTONOMY
GENERATED IMAGE != EVIDENTIARY SOURCE
CI GREEN != VERCEL FIRESTORE PROVIDER OR CHANNEL READINESS
```

The existing operational authority layer may determine that orchestration can **attempt** an action. It does not replace downstream verification, editorial, publication, persistence, audit, social or visual gates.

## Verification and factual integrity

- Critical-risk stories remain blocked from autonomous editorial flow.
- Contradicted/disputed/high-risk/insufficiently verified stories keep their existing human-review requirements.
- Never weaken verification confidence, primary-source, contradiction or grounding gates merely to make a story publishable.
- Generated text or images cannot become source evidence.
- Never invent sources, URLs, timestamps, quotes, primary-source status or verification results.
- A successful fetch proves retrieval, not truth or source authority.

## Publication boundaries

- Current Facebook/Instagram publication remains human-review/manual in v1.
- `WEB_AUTONOMOUS` is an exact operator-authorized profile for deterministic low-risk web publication only.
- `WEB_AUTONOMOUS` does not authorize email, social or image automation.
- Never bypass story approval, idempotency, retry budgets, daily budgets, kill switches or publication gates.
- Never treat a merge, CI success or agent recommendation as production activation approval.

## Secrets and external systems

Never expose or commit real values for:

- `GEMINI_API_KEY`
- `CRON_SECRET`
- `RESEND_API_KEY`
- Firestore credentials
- Facebook/Instagram credentials
- email recipients or private addresses
- Vercel secret values.

Example environment files must contain placeholders only.

Firestore, Gemini, Resend, social channels and Vercel are external evidence surfaces. Repository CI cannot prove their real production readiness.

## ORBI Agent Engineering Kit state

Current News pilot uses the selective ORBI Agent Engineering Kit pattern.

- repository adapter: `.orbi/repository-adapter.json`
- selective profile: `.orbi/ecc-profile.json`
- pilot documentation: `docs/ecc/**`
- dedicated staging PR gate: `.github/workflows/orbi-news-ecc-pr-gate.yml`

The Agent Kit has no authority to change ORBI News activation, publication, secrets, editorial truth or product autonomy.

During the initial pilot, the following Agent Kit capabilities remain disabled:

- hooks;
- MCP;
- continuous learning;
- unified memory;
- Agent Kit autonomous loops;
- multi-agent runtime roles.

ORBI News product autonomy is a separate existing product subsystem and must not be confused with Agent Kit autonomous-loop features.

## Required ORBI News software gate

For News changes, the CI-compatible repository gate is:

```bash
npm ci
npm run lint
npm run test:orbi-news
npm run build
```

Do not claim that this gate proves real provider, Firestore, Vercel or publication-channel readiness.

## Completion report for News work

Record:

- exact branch and final HEAD;
- changed News surfaces;
- deterministic test result;
- TypeScript result;
- build result;
- verification/editorial/publication authority impact;
- secret/external-system impact;
- external evidence still pending.
