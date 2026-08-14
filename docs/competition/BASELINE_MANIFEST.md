# Baseline Manifest

## Audit Context

- Audit date: 2026-08-03
- Production URL: https://orbiecosystem.vercel.app/
- Current branch: `competition/ai-climate-innovation-2026`
- Current HEAD: `13accd1b241c73dbb07420aea726c73e8c138529`
- HEAD short: `13accd1`
- HEAD subject: `docs: add repository instructions for Codex`
- Backup tag: `v1.0.0-pre-climate-competition-backup`
- Backup branch: `backup/pre-climate-competition-2026`

## Repository State Before WEB-01 Edits

```txt
git branch --show-current
competition/ai-climate-innovation-2026

git rev-parse HEAD
13accd1b241c73dbb07420aea726c73e8c138529

git status --short

```

Result: clean tree confirmed before WEB-01 edits.

## Architecture

- Framework: React SPA with Vite
- Framework versions verified from installed dependencies:
  - `react@19.2.7`
  - `react-dom@19.2.7`
  - `vite@6.4.3`
  - `typescript@5.8.3`
  - `express@4.22.2`
- Language: TypeScript / TSX
- Server: Express custom server in `server.ts`
- Routing: single-page section navigation through `src/App.tsx`; no React Router or file-based routing detected
- Content structure: TypeScript objects in `src/data.ts` with interfaces in `src/types.ts`; additional component-local copy exists in TSX files
- Build tool: Vite client build plus esbuild bundling for `server.ts`
- Node: `v22.13.1`
- Package manager: npm
- npm version: `10.9.2`
- Lockfile: `package-lock.json`

## Real package.json Scripts

```txt
dev: tsx server.ts
build: vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs
start: node dist/server.cjs
clean: rm -rf dist server.js
lint: tsc --noEmit
```

## Initial Routes And Components

- `/`: current SPA home and corporate page
- `/orbi-docs/`: static public demo under `public/orbi-docs/`
- `POST /api/foton-prime/chat`: server endpoint in `server.ts`
- `POST /api/foton-prime/edit`: server endpoint in `server.ts`

Key components detected:

- Header/navigation: `src/components/Header.tsx`
- Hero: `src/components/HeroSection.tsx`
- Divisions: `src/components/DivisionCards.tsx`
- Projects: `src/components/ProductGrid.tsx`
- Roadmap: `src/components/Roadmap.tsx`
- Footer: `src/components/Footer.tsx`
- Developer panel and presentation: `src/components/VideoModal.tsx`
- Foton Prime section: `src/components/FotonPrimeSection.tsx`

## WEB-01 QA Results

The WEB-01 QA commands were executed after creating documentation and the typed competition content registry.

Typecheck / lint:

```txt
npm.cmd run lint

> react-example@0.0.0 lint
> tsc --noEmit
```

Result: passed with exit code `0`. This is the real lint script and also the available typecheck because it runs `tsc --noEmit`.

Tests:

```txt
package.json scripts
```

Result: no `test` script is defined in `package.json`; tests were not executed.

Build:

```txt
TEMP_BUILD_DIR=C:\Users\cyvit\AppData\Local\Temp\orbi-web01-build-772b0a882e1e4c6990236b2ec619cd88
npm.cmd run build

> react-example@0.0.0 build
> vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs

vite v6.4.3 building for production...
1687 modules transformed.
dist/index.html                 0.47 kB | gzip:   0.30 kB
dist/assets/index-CXGaQR6A.css 270.52 kB | gzip:  31.25 kB
dist/assets/index-DoHmhSmp.js  366.05 kB | gzip: 102.99 kB
dist/server.cjs                 15.1kb
Done in 22ms
```

Result: passed with exit code `0`. Build was executed in an isolated temporary copy to avoid modifying repository build artifacts.

## Pre-existing Errors And Limitations

- No `robots.txt` detected.
- No `sitemap.xml` detected.
- `index.html` contains minimal metadata only; no meta description, canonical URL, Open Graph tags or Twitter/X card tags detected.
- `index.html` uses `lang="en"` while visible content is mostly Spanish.
- No analytics integration detected.
- No internationalization framework detected.
- Contact form UI exists in `FinalCTA.tsx`, but no backend submission endpoint is wired for it.
- Accessibility support is partial; some `alt`, `title`, labels and one menu `aria-label` exist, but modals and several controls do not expose complete ARIA semantics.
- Code references `/assets/orbi/orbi-ecosystem-logo.png`, but that file was not present.
- `public/assets/orbi/orbi-ecosystem-intro.mp4` exists, but its contents are an XML `AccessDenied` response rather than a playable MP4.
- Several Spanish strings display mojibake encoding artifacts in source files.
- The developer panel relies on client-side `localStorage`, default PIN flow and client-side authentication states; it should not be treated as production security.
- No automated test suite is configured in `package.json`.

## WEB-01 Scope Confirmation

- Interface components were not intentionally modified.
- Public routes were not created.
- Vercel configuration was not modified.
- Secrets were not read or printed.
- Dependencies were not added.
- Production was not deployed.
