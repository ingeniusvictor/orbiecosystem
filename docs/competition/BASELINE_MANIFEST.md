# ORBI Ecosystem Baseline Manifest

## Baseline

- Date: 2026-08-03
- Production URL: https://orbiecosystem.vercel.app/
- Baseline commit: `7630c501febf3e97e6d63d0e848aa01c95a4d2ab`
- Source branch before backup: `main`
- Backup tag: `v1.0.0-pre-climate-competition-backup`
- Backup branch: `backup/pre-climate-competition-2026`
- Working branch: `competition/ai-climate-innovation-2026`

## Stack

- Framework: React SPA with Vite
- Language: TypeScript / TSX
- Routing: single-page section navigation through component state and DOM section IDs; no file-based router and no React Router detected
- Server: Express custom server in `server.ts`
- Build tool: Vite for the client bundle plus esbuild for `server.ts`
- Package manager: npm, identified by `package-lock.json`
- Node: `v22.13.1`
- npm: `10.9.2`

## Available Commands

```txt
npm run dev
npm run build
npm run start
npm run clean
npm run lint
```

Script definitions from `package.json`:

```txt
dev: tsx server.ts
build: vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs
start: node dist/server.cjs
clean: rm -rf dist server.js
lint: tsc --noEmit
```

## QA Results

Initial Git gate before backup:

```txt
git branch --show-current
main

git rev-parse HEAD
7630c501febf3e97e6d63d0e848aa01c95a4d2ab

git status --short

```

Result: clean tree confirmed before creating the backup tag and branches.

Typecheck / lint:

```txt
npm.cmd run lint

> react-example@0.0.0 lint
> tsc --noEmit
```

Result: passed with exit code `0`.

Tests:

```txt
npm test
```

Result: not executed because `package.json` does not define a `test` script.

Build:

Executed in an isolated temporary copy to avoid modifying repository `dist`:

```txt
TEMP_BUILD_DIR=C:\Users\cyvit\AppData\Local\Temp\orbi-web00b-build-7ca9cebddd504a138ce28de20280917d
npm.cmd run build

> react-example@0.0.0 build
> vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs

vite v6.4.3 building for production...
1687 modules transformed.
dist/index.html                 0.47 kB | gzip:   0.30 kB
dist/assets/index-CXGaQR6A.css 270.52 kB | gzip:  31.25 kB
dist/assets/index-DoHmhSmp.js  366.05 kB | gzip: 102.99 kB
dist/server.cjs                 15.1kb
```

Result: passed with exit code `0`.

## Known Limitations

- No `robots.txt` detected.
- No `sitemap.xml` detected.
- `index.html` has minimal metadata only; no meta description, canonical URL, Open Graph tags, or Twitter card tags detected.
- `index.html` uses `lang="en"` while the visible content is mostly Spanish.
- No analytics integration detected.
- No internationalization framework detected.
- Contact form UI exists, but no backend submission endpoint is wired for it.
- Accessibility support is partial: some `alt`, labels, titles, and one menu `aria-label` exist, but modals and several controls do not expose complete ARIA semantics.
- The code references `/assets/orbi/orbi-ecosystem-logo.png`, but that file was not present in the repository baseline.
- `public/assets/orbi/orbi-ecosystem-intro.mp4` exists, but its file contents are an XML `AccessDenied` response rather than a playable MP4.
- Several Spanish strings display mojibake encoding artifacts in source files.
- The developer panel relies on client-side `localStorage`, a default PIN flow, and simulated/client-side authentication states; it should not be treated as production security.
- No automated test suite is configured.

## Safety Notes

- No production deployment was performed.
- No secrets were read or printed.
- No Vercel configuration was modified.
- No history rewrite or force push was performed.
- No interface components, styling, routes, product data, or assets were modified as part of this baseline backup module.
