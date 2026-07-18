# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`@svnbjrn/design` is a dark-first **Svelte 5** (runes + snippets) component / design-token library: 28 core components, dark/light + runtime world themes, hostile-input vernacular parsing, deterministic seed-to-theme generation, cross-platform token output (CSS/JSON/QSS), self-hosted subset fonts, and two opt-in visual languages (Vermis, Carter). No utility-class framework — style with component props and `--sv-*` tokens.

`.github/copilot-instructions.md` is the detailed, review-derived source of truth for change rules (accessibility, async cleanup, theme/untrusted-data gating, cross-surface update requirements). Read it before non-trivial component/theme edits. This file is the fast orientation.

## Commands

Requires Node `>=22` (CI uses 24) and pinned `pnpm@11.3.0`. Bootstrap: `pnpm install --frozen-lockfile`.

```bash
pnpm run check                   # svelte-check (strict) — the type gate
pnpm test                        # Vitest unit (jsdom), --project=unit
pnpm run test:watch              # unit watch
pnpm run build                   # tokens + fonts + svelte-package + publint
pnpm run tokens                  # regenerate token outputs from DTCG source
pnpm run fonts                   # subset fonts (needs pyftsubset / FontTools)
pnpm dev                         # standalone Vite preview page
pnpm run storybook               # Storybook dev, port 6006
CI= pnpm run test:visual         # Chromium story screenshots; clear CI to skip Argos upload
pnpm exec playwright install chromium   # once per machine, before visual tests
```

Run a single unit test: `pnpm exec vitest run --project=unit src/lib/components/atoms/Button.test.ts` (or `-t "name"` to filter by test title).

Gotchas: unit tests print harmless jsdom `Could not parse CSS stylesheet` noise — judge the final Vitest summary. `pnpm run build` prints expected `PfEd NOT subset`; publint must end `All good`. Three known Svelte warnings exist (Tooltip, Modal, Sheet) — do not add more. `test:visual` uploads to Argos whenever `CI` is truthy, so clear inherited `CI` locally.

## Architecture

**Tokens are the source of truth, and generated outputs are committed.** DTCG sources live in `src/lib/tokens/*.tokens.json` + the `themes.ts` registry. `scripts/build-tokens.mjs` emits `src/lib/tokens/scale.css`, `src/lib/tokens/colors.css`, `src/lib/tokens/palette.ts`, `src/lib/tokens/resolved/*.tokens.json`, and `src/lib/qss/*.qss`. **Never hand-edit generated outputs** — edit the DTCG source, run `pnpm run tokens`, commit every output. Drift is guarded by tests. Adding a built-in theme = one token file + one registry entry.

**Cascade layers** order token precedence: `sv.base < sv.theme < sv.world < sv.user`. Consumer *unlayered* overrides beat all of them.

Key `src/lib/` areas:
- `components/{atoms,layout,molecules}` — core components with colocated `*.test.ts`. `index.ts` is the public barrel; every public change must stay in sync with it.
- `theme/` — runtime theming: `parse` (world-theme grammar), `gate`/`validate` (WCAG AA contrast gating), `apply`/`css` (appliers + emitters, View Transitions), `boot` (pre-paint FOUC script), `registry`, plus `svelte.svelte.ts` wrapper. Errors are returned as `Result`-style values, never thrown.
- `generate/` — deterministic seed-to-theme solver (`solve`, `assign`, `hints`); contrast targets are solver inputs, WCAG AA holds by construction. Backs the `design-generate` bin and the Storybook Theme Lab.
- `vernacular/` — parses **untrusted** per-world string catalogs like hostile input (Unicode NFC, rejects control/bidi/invisible chars, length caps); resolves to component props with world→English fallback.
- `internal/` — shared `color`/`contrast` math, `focus-trap`, and **`invariants.ts`** (versioned world-theme rules — never tighten a published threshold without versioning + updating docs/fixtures/tests/adapter together).
- `vermis/` and `carter/` — isolated opt-in systems with their own component barrels + required stylesheets. Never leak their `--layform-*` / `--carter-*` tokens into core `--sv-*`, and never let opting in silently restyle core.

**Stories are browser visual regression tests.** `src/stories/*` covers both themes through Storybook and Argos. The workflow's visual/Argos job is currently disabled, so run `CI= pnpm run test:visual` and verify both themes locally until it is re-enabled. User-visible component/token changes need deterministic stories with no time, locale, or randomness. See `docs/visual-testing.md`.

**React bridge.** `.design-sync/react-adapter` + `.design-sync/previews` are a *committed*, hand-maintained bridge — nothing regenerates them. Public component/prop/event/snippet changes must update the adapter (`index.js`, `index.d.ts`, `wrap.js`) and the owned preview; React camelCase event aliases must match Svelte lowercase props (`onclick`).

## Conventions

- Svelte 5 patterns, lowercase callback props (`onclick`), `$props.id()` for SSR-stable IDs. Use `Stack` for layout.
- Errors as values (`Result`/issue arrays), not exceptions — matches the theme/vernacular/generate APIs throughout.
- Treat theme + vernacular inputs as hostile: bound size before flattening, reject unsupported prototypes/getters, normalize Unicode, return issues rather than throw.
- Type-check or execute README/doc examples before claiming they work; keep docs and checkboxes synced to the diff.
