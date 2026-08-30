# ORBI Platform Season 1 — PR Readiness Checklist

## Branch

- Repository: `v1m2l3p4/orbiecosystem`
- Working branch: `feature/orbi-platform-season1`
- Target branch: `main`

## Scope

This branch prepares the ORBI Ecosystem website as a Season 1 platform showcase.

Primary objective: present ORBI as a clear, premium, AI-native ecosystem with a strong home page narrative, improved navigation, better responsive behavior, and corrected product branding.

## Season 1 structure

The public website now presents ORBI through the following structure:

1. ORBI Development System
2. ORBI Corporate System
3. ORBI Academy
4. ORBI Instalaciones y Servicios
5. ORBI Sleep Frequencies
6. ORBI Game System
7. ORBI News as a transversal module

## Main changes completed

- Premium Hero cleanup and improved visual start position.
- Removed broken Hero side panel that clipped on zoomed layouts.
- Added global panoramic layout behavior for main website sections.
- Improved responsive behavior for desktop, zoomed desktop and constrained widths.
- Added Season 1 ecosystem map with six divisions and ORBI News.
- Reworked At a Glance into a more compact executive explanation.
- Upgraded Product Showcase for Season 1 presentation.
- Corrected product branding from PBMetrics to PVMetrics.
- Aligned Foton Prime with the public ChatBox-ready narrative.
- Upgraded Roadmap, Final CTA and Footer for Season 1 launch readiness.
- Fixed header navigation anchors to point to real active sections.
- Added final CTA anchor for Contact navigation.
- Forced home route to start at the top on page load.

## Validation required before PR

Run locally from the repository root:

```powershell
git switch feature/orbi-platform-season1
git pull origin feature/orbi-platform-season1
npm run lint
npm run build
git status --short
```

Expected result:

- `npm run lint`: PASS
- `npm run build`: PASS
- `git status --short`: clean, unless local-only lockfile changes are intentionally pending

## Visual QA checklist

Review the Home page at 100%, 90% and 80% zoom:

- Hero starts at the top.
- No right-side clipped Hero panel appears.
- Header navigation is visible and usable.
- Season 1 map is visible and balanced.
- At a Glance no longer feels like a lab screen.
- Product Showcase uses PVMetrics, not PBMetrics.
- Foton Prime is clear as a ChatBox-ready layer.
- Roadmap, Final CTA and Footer feel aligned with the rest of the page.
- No major empty or broken visual areas appear on desktop.

## Navigation QA checklist

Validate the following header actions:

- Explore → `ecosistema-mirada`
- Solutions → `ecosystem-season-one`
- Academy → `ecosistema-mirada`
- Innovation → `roadmap`
- News → `proyectos`
- Contact → `season-one-final-cta`
- Explorar ORBI → `ecosystem-season-one`

Validate direct routes:

- `/`
- `/climate-recovery`
- `/climate-recovery/en`
- `/projects/orbi-pvmetrics`

## Notes

- ORBI ChatBox IA remains a separate product/workstream. The website is ChatBox-ready but does not merge the internal ChatBox development into this landing.
- No production API keys, database secrets or external production integrations should be introduced by this branch.
- Season 1 prioritizes clarity, credibility, visible execution and launch readiness.

## PR recommendation

Open a pull request only after local lint/build and visual QA pass.

Recommended PR title:

`feat: launch ORBI Platform Season 1 website experience`

Recommended PR base/head:

- Base: `main`
- Head: `feature/orbi-platform-season1`
