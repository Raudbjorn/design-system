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
  swapTheme, themeCss, contrastRatio, dark, light, amber) pass through UNWRAPPED —
  re-exported from dist in index.js, hand-typed in index.d.ts (2026-07-04).
- **The adapter build is `cfg.buildCmd`'s second half** — `pnpm run build`
  (tokens, fonts, svelte-package) then `node .design-sync/react-adapter/build.mjs`
  (vite lib build with the repo's own vite/svelte-plugin/svelte versions; also
  recreates the symlinks below).

## Environment gotchas

- `[GENERAL]` **--node-modules must be `.ds-sync/node_modules`**, not the repo's:
  this Svelte repo has no react; react@18.3.1 + react-dom@18.3.1 are installed
  into `.ds-sync/` for `_vendor/` UMD vendoring. Fresh clone:
  `(cd .ds-sync && pnpm add esbuild ts-morph @types/react playwright react@18.3.1 react-dom@18.3.1 && pnpm exec playwright install chromium)`. 
- `[GENERAL]` **Some machines have no `npm`/`npx` at all, only `pnpm`.** Use
  `pnpm add <pkgs>` (not `npm i`) to install the `.ds-sync/` converter deps,
  and `pnpm exec <bin>` (not `npx <bin>`) for playwright/storybook/vite. The
  committed `.design-sync/react-adapter/build.mjs` was changed from
  `execSync('npx vite build ...')` to `execSync('pnpm exec vite build ...')`
  for this reason — re-check it hasn't regressed to `npx` if the adapter
  build fails with `npx: command not found`.
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
- `cfg.overrides.Stack.cardMode: "column"` — the Gap scale story
  (`[GRID_OVERFLOW] wide`).
- `cfg.overrides.Modal` / `cfg.overrides.Sheet`: `cardMode: "single"` (fixed
  overlay content escapes any grid cell — `[GRID_OVERFLOW] escape`) +
  `skip` the one story per component whose open/portal state doesn't render
  in the reference storybook either (`sb-error: no storybook root content`):
  `molecules-modal--open`, `molecules-sheet--right`. The remaining story
  (`Interactive`, `Left`) is the `primaryStory` and is what actually gets
  graded.
- **`cardMode: "single"` cannot faithfully render a full-viewport
  `position:fixed;inset:0` backdrop/panel** (Sheet's `Left` story graded
  `close`, not `match`, for this reason): `emit.mjs`'s single-card wrapper
  (`.ds-single{transform:translateZ(0)}`) becomes the containing block for
  fixed descendants but has no explicit height, so `inset:0`/`height:100%`
  resolve to content-based auto height instead of full viewport — the
  backdrop and panel render short. This is a harness limitation (`emit.mjs`
  is app-contract surface, never forked), not a component defect; don't
  spend another cycle chasing it on Sheet or any future full-viewport
  drawer/dialog in single mode — grade `close` with this explanation.
- `.design-sync/tsconfig.json` exists purely for the EDITOR (quarantines
  previews/*.tsx onto the React types via paths); the pipeline compiles
  previews with esbuild and never reads it.

## Fixes log

- **Stack's owned preview (`Playground`/`Row`/`Wrapping`) had drifted from
  `src/stories/layout/Stack.stories.svelte`**: it mirrored an old version of
  the story with generic placeholder boxes ("one"/"two"/"three",
  "chunk-0".."chunk-13") instead of the current story's real composition
  (StatCard+Button+Badge+Kbd+Text; Avatar+Text+Badge+Button; 14 named
  Badges). Graded `mismatch` on this run and rewritten to mirror the story
  exactly. Lesson for future re-syncs: an owned preview is never
  auto-diffed against its story source — periodically re-read the story
  file for components with owned previews, don't assume "it was graded
  before" means it still matches.
- Stack also needed a `GapScale` export added (`unpaired`: the story
  "Gap scale" had no matching export) — mirrors the story's SpecRow-based
  spacing-scale demo with an inlined SpecRow (no React port of
  `src/stories/foundations/SpecRow.svelte` exists yet).
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
- **The claude.ai/design project this repo was pinned to can disappear**
  (deleted from the account) without the repo knowing — `get_project`
  returned 404 on the 2026-09-06 re-sync despite a `projectId` already
  recorded in `config.json`. When that happens there's no anchor to recover
  from: a fresh project was created and every component re-verified from
  scratch (effectively a first sync, even though local previews/config were
  reused). If `get_project` 404s again, don't assume the repo's local grade
  history predicts what's already uploaded — nothing is uploaded.
- **Modal/Sheet single-card overrides and the Sheet `close` verdict are
  new as of 2026-09-06** — this repo had never synced these two through
  `cardMode: "single"` before (only `Text`/`Stack` had `cardMode: "column"`
  previously). Re-verify them normally on the next re-sync rather than
  assuming they're settled; the Sheet backdrop-height limitation above is
  expected to recur and grade `close` again unless `emit.mjs` changes.
