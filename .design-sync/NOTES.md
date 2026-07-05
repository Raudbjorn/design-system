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
  token background/ink/font (.storybook/preview.css equivalent). Non-component
  exports (theme-as-data spine: applyTheme, contrastGates, defineTheme,
  swapTheme, themeCss, contrastRatio, dark, light) pass through UNWRAPPED —
  re-exported from dist in index.js, hand-typed in index.d.ts (2026-07-04).
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
- `[GENERAL]` Foundations stories (Colors, Typography, Spacing & Radius,
  Theming, Theme Lab, World Theme) are showcase-only, not package exports —
  excluded via `titleMap` nulls. NB title-derived names strip spaces:
  "Spacing & Radius" → **`Spacing&Radius`**, "Theme Lab" → **`ThemeLab`**,
  "World Theme" → **`WorldTheme`**. (Foundations/Overview is docs-only MDX and
  never enters title mapping.)
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
- ~~publint `import.meta.env` warning (CodeBlock dev guard)~~ obsolete since
  7507e70: CodeBlock now imports `DEV` from `esm-env`; vite's adapter build
  resolves the browser-prod condition to `false` at compile time, so nothing
  import.meta-shaped reaches the converter. (esm-env is a repo dependency —
  present after `pnpm i`.)

## Re-sync risks

- **Adapter drift**: a new component added to `src/lib/index.ts` must ALSO be
  added to `.design-sync/react-adapter/index.js` (wrap call + snippet-prop
  list) and `index.d.ts` (Props interface), plus an owned preview authored —
  nothing regenerates these. The converter will surface a missed one as
  `[TITLE_UNMAPPED]` (not in react-dist exports) or a floor card (no preview).
  This EXTENDS to non-component exports: a new function/data export in
  `src/lib/index.ts` needs an index.js re-export + index.d.ts declaration or
  it silently vanishes from the design agent's bundle (nothing warns — the
  IIFE only exposes what react-dist exports). Diff `src/lib/index.ts` against
  the adapter's export list on every re-sync.
- **Snippet-prop drift**: a new Snippet prop on an existing component (e.g. a
  Card "media" slot) must be added to the wrap() snippetProps list and typed
  as React.ReactNode — otherwise the raw React node is passed to Svelte as a
  scalar and renders nothing. Scalar props (e.g. the 2026-07 vernacular
  labels: NavBar navLabel/menuLabel, CodeBlock copyLabel/copiedLabel/
  copyAriaLabel) pass through the props bag automatically but still need
  index.d.ts entries; a new slot in the library's `Vernacular` interface
  means a new component grew vernacular props — mirror them.
- **Svelte version bumps**: react-dist inlines the svelte runtime compiled by
  the repo's own toolchain (vite plugin), so repo upgrades flow through on
  rebuild. The compare oracle will catch behavioral drift.
- **Verified partially**: local grade cache (`.design-sync/.cache/compare/`)
  does NOT persist — first-sync grades live only in the uploaded
  `_ds_sync.json`. On the 2026-07-04 re-sync, CodeBlock (4 stories) and
  NavBar (1 story) were re-captured and image-graded `match` after their
  source changed (vernacular props + esm-env swap; defaults preserve
  rendering); the other 11 stayed verified-by-upload via the anchor.
  Conventions-header example palette `{accent:'#ff9d45','accent-2':'#d96c5f'}`
  verified `ok` against dist gates this run — re-verify if contrastGates
  tighten.
- **Build assumptions**: node ≥20 (import.meta.dirname in vite config),
  pnpm 11, `.ds-sync/` deps present. `dist/` is gitignored — `buildCmd`'s
  `pnpm run build` must run before the converter on every fresh clone.
