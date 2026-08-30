# AGENTS.md — ORBI Ecosystem Corporate Website

## Product identity

Official company: ORBI Ecosystem SpA

Website: https://orbiecosystem.vercel.app/

Headquarters: Rancagua, Chile

Founded: 2026

Competition product: ORBI PVMetrics IA — Climate Recovery Edition

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
- Product: ORBI PVMetrics IA.
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