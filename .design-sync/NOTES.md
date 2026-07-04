# design-sync notes — @svnbjrn/design

## Repo shape (read first)

- **Svelte 5 library; the converter is React-only.** The sync ships the real
  compiled `dist/` behind a thin React adapter: `.design-sync/react-adapter/`
  (committed) builds `.design-sync/react-dist/` (gitignored) — a mini-package
  (`package.json` + compiled `index.js` + `index.css` + hand-authored React
  `index.d.ts`) that `cfg.entry` points at, so the converter's PKG_DIR/types/
  cssEntry heuristics all read the React surface. Core: `wrap.js` mounts each
  dist component via Svelte 5 `mount()` with a `$state` props bag
  (`state.svelte.js` + `host.svelte`); React children/named-snippet props
  (children, header, footer, brand) are adopted into `createRawSnippet`s via
  React portals into `display:contents` containers. `ThemeRoot` (the
  cfg.provider) reproduces the repo Storybook's frame: `data-theme="dark"` +
  token background/ink/font (.storybook/preview.css equivalent).
- **The adapter build is `cfg.buildCmd`'s second half** — `pnpm run build`
  (tokens, fonts, svelte-package) then `node .design-sync/react-adapter/build.mjs`
  (vite lib build with the repo's own vite/svelte-plugin/svelte versions; also
  recreates the symlinks below).

## Environment gotchas

- `[GENERAL]` **--node-modules must be `.ds-sync/node_modules`**, not the repo's:
  this Svelte repo has no react; react@18.3.1 + react-dom@18.3.1 are installed
  into `.ds-sync/` for `_vendor/` UMD vendoring. Fresh clone:
  `(cd .ds-sync && npm i esbuild ts-morph @types/react playwright react@18.3.1 react-dom@18.3.1 && npx playwright install chromium)`.
- `[GENERAL]` **Self symlink** `.ds-sync/node_modules/@svnbjrn/design → ../../..`
  (repo root) makes `tokensPkg`/`tokensGlob` copy `dist/tokens/*.css`.
  `.design-sync/node_modules → ../.ds-sync/node_modules` gives
  `react-dist/index.d.ts` @types/react resolution for the ts-morph dts stage.
  Both are recreated by `build.mjs` (idempotent); both gitignored.
- `[GENERAL]` **`! story parse failed: … .svelte` noise (14 lines) is expected**:
  esbuild can't parse `.stories.svelte`, so story-module pairing yields 0/38 —
  pairing instead happens at compare time against the owned previews' export
  names (squash of exportName(story name)). All 13 previews are owned
  (`.design-sync/previews/`); the generated tier can never fire for this repo.
- `[GENERAL]` Foundations stories (Colors, Typography, Spacing & Radius) are
  showcase-only, not package exports — excluded via `titleMap` nulls. NB the
  title-derived name for "Spacing & Radius" is **`Spacing&Radius`** (spaces
  stripped around `&`).
- Chromium defaults to light `prefers-color-scheme`; tokens are dark-first but
  flip light under that media query — `ThemeRoot theme=dark` (cfg.provider)
  matches the reference Storybook's `withThemeByDataAttribute` dark default.
  The decorator auto-bundle can't work here (`.storybook/preview.ts` imports
  addon-themes, which the stubs make inert) — cfg.provider is load-bearing.
- `cfg.overrides.Text.cardMode: "column"` — the Mono story (long curl line)
  renders wider than a grid cell (`[GRID_OVERFLOW] wide`).
- `.design-sync/tsconfig.json` exists purely for the EDITOR (quarantines
  previews/*.tsx onto the React types via paths); the pipeline compiles
  previews with esbuild and never reads it.

## Fixes log

- rmSync on an existing symlink was unreliable for ensureLink → readlink
  check + unlinkSync (build.mjs).
- publint's `import.meta.env` warning (CodeBlock dev guard) is neutralized in
  the adapter build by vite's define; in the converter's IIFE pass esbuild
  lowers `import.meta` to an empty shim → the guard resolves undefined→false
  by design. No action needed.

## Re-sync risks

- **Adapter drift**: a new component added to `src/lib/index.ts` must ALSO be
  added to `.design-sync/react-adapter/index.js` (wrap call + snippet-prop
  list) and `index.d.ts` (Props interface), plus an owned preview authored —
  nothing regenerates these. The converter will surface a missed one as
  `[TITLE_UNMAPPED]` (not in react-dist exports) or a floor card (no preview).
- **Snippet-prop drift**: a new Snippet prop on an existing component (e.g. a
  Card "media" slot) must be added to the wrap() snippetProps list and typed
  as React.ReactNode — otherwise the raw React node is passed to Svelte as a
  scalar and renders nothing.
- **Svelte version bumps**: react-dist inlines the svelte runtime compiled by
  the repo's own toolchain (vite plugin), so repo upgrades flow through on
  rebuild. The compare oracle will catch behavioral drift.
- **Verified partially**: nothing — all 13 components graded story-by-story
  from images on the first sync (41 stories, no [STORY_CAP], no skips).
- **Build assumptions**: node ≥20 (import.meta.dirname in vite config),
  pnpm 11, `.ds-sync/` deps present. `dist/` is gitignored — `buildCmd`'s
  `pnpm run build` must run before the converter on every fresh clone.
