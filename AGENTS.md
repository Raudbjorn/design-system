# Repository Guidelines

## Project Overview

`@svnbjrn/design` is a dark-first Svelte 5 component and design-token library. It ships 28 core components, dark/light and runtime world themes, hostile-input vernacular catalogs, deterministic seed-to-theme generation, CSS/JSON/QSS token outputs, self-hosted fonts, and opt-in Vermis and Carter visual languages. Use Svelte 5 runes/snippets, TypeScript, component props, and CSS custom properties; there is no utility-class framework.

Read `CLAUDE.md` for fast orientation and `.github/copilot-instructions.md` before non-trivial component or theme work; the latter is the detailed, review-derived change contract.

## Architecture & Data Flow

- **Token build:** DTCG sources in `src/lib/tokens/*.tokens.json` plus `themes.ts` flow through `scripts/build-tokens.mjs` and its emitters into committed `scale.css`, `colors.css`, `palette.ts`, `resolved/*.tokens.json`, and `qss/*.qss`. Edit sources, run `pnpm run tokens`, and commit every generated change. Never hand-edit outputs.
- **Runtime themes:** untrusted JSON enters `src/lib/theme/parse.ts`, resolves DTCG aliases, passes the closed token registry and per-type grammar, then the WCAG rules in `src/lib/internal/invariants.ts`. Successful themes become layered CSS through `theme/css.ts` and `theme/apply.ts`; failures return typed issue arrays. `theme/boot.ts` prevents pre-paint FOUC, while `theme/svelte.svelte.ts` provides reactive state with stale-async protection.
- **Generation:** seeds and optional atmosphere hints flow through `src/lib/generate/{assign,solve,generate}.ts`; OKLCH color solving produces a world-theme package that must pass the same runtime gates. The pipeline backs `bin/design-generate.mjs` and Storybook Theme Lab.
- **Vernacular:** catalogs pass through Unicode normalization, control/bidi rejection, placeholder validation, and `VERNACULAR_REGISTRY`; `vernacular/resolve.ts` returns spread-safe component props with world-to-English/default fallback. Treat all catalog input as hostile.
- **Consumers:** `src/lib/index.ts` and subsystem barrels define published APIs. Svelte consumers use compiled exports directly. `.design-sync/react-adapter` mounts the real Svelte components and maps React portals/events; it is hand-maintained, not generated. Stories exercise public components as visual regression tests.

## Key Directories

| Path | Purpose |
| --- | --- |
| `src/lib/components/{atoms,layout,molecules}` | Core Svelte components and colocated tests |
| `src/lib/theme` | Parsing, validation, contrast gating, CSS/application, boot script, Svelte wrapper |
| `src/lib/tokens` | DTCG sources, resolver, theme registry, committed generated outputs |
| `src/lib/generate` | Deterministic seed/hint-to-theme solver |
| `src/lib/vernacular` | Untrusted string-catalog grammar, registry, fallback, escaping, Svelte context |
| `src/lib/internal` | Shared color/contrast math, focus trap, versioned invariants |
| `src/lib/vermis`, `src/lib/carter` | Isolated opt-in component/token systems |
| `src/stories`, `.storybook` | Storybook documentation and Chromium visual-test setup |
| `scripts`, `scripts/emitters` | Token/font generation and artifact drift guards |
| `.design-sync` | Committed React bridge, previews, and converter configuration |
| `docs` | Theme-package, integration, and visual-testing contracts |

## Development Commands

```bash
pnpm install --frozen-lockfile          # bootstrap
pnpm dev                                # standalone Vite preview
pnpm run storybook                      # Storybook dev on :6006
pnpm run check                          # svelte-check; no new warnings
pnpm test                               # Vitest unit project (jsdom)
pnpm run test:watch                     # unit watch mode
pnpm run build                          # tokens + fonts + package + publint
pnpm run tokens                         # regenerate committed token outputs
pnpm run fonts                          # subset fonts; requires pyftsubset/FontTools
pnpm exec playwright install chromium   # once before visual tests
CI= pnpm run test:visual                # browser stories without Argos upload
pnpm run build-storybook                # static Storybook build
```

Run one test with, for example:

```bash
pnpm exec vitest run --project=unit src/lib/components/atoms/Button.test.ts
pnpm exec vitest run --project=unit -t "prevents clicks when disabled"
```

## Code Conventions & Common Patterns

- Components are `PascalCase.svelte`; tests are colocated as `Name.test.ts`. Utility modules use descriptive lowercase names such as `parse.ts`, `gate.ts`, and `resolve.ts`. No Prettier configuration is committed; mirror adjacent formatting.
- Use strict ESM TypeScript and Svelte 5 runes (`$props`, `$state`, `$derived`) and snippets. Use lowercase callback props such as `onclick`, `$props.id()` for SSR-stable IDs, and `Stack` for layout. No external state library is used.
- Styling is token-first. Core tokens use `--sv-*`; cascade order is `sv.base < sv.theme < sv.world < sv.user`, with consumer unlayered CSS taking precedence. Never leak `--layform-*` or `--carter-*` into core.
- Return `Result`-style values or issue arrays from theme, vernacular, and generation APIs; do not throw for expected invalid input. Bound size before traversal, reject unsupported prototypes/accessors, avoid invoking getters/proxies, normalize Unicode, and validate selectors before CSS interpolation.
- Cancel prior timers/tasks before replacement. Guard code after `await` with destruction or generation state so late completions cannot mutate unmounted state or overwrite newer work. Svelte wrappers use local runes/context rather than global mutable stores.
- Accessibility is part of the component API: preserve label/description/control relationships, stable accessible names, native value types, disabled/selected visuals, and topmost-only overlay handling. Key stateful lists by stable domain identity.
- Public component, prop, event, or snippet changes must stay synchronized across implementation/tests, `src/lib/index.ts`, stories, `.design-sync/react-adapter/{index.js,index.d.ts,wrap.js}`, and the owned React preview.

## Important Files

- `package.json`: scripts, Node/pnpm requirements, exports map, CLI, peer dependencies.
- `src/lib/index.ts`: public component and API barrel; `src/lib/index.test.ts` audits exports.
- `src/lib/tokens/themes.ts`: built-in theme registry.
- `src/lib/internal/invariants.ts`: versioned `CONTRAST_RULES`; do not tighten published thresholds without coordinated docs, fixtures, tests, and adapter updates.
- `vitest.config.ts`, `vitest-setup.ts`: unit/browser projects and required jsdom polyfills.
- `.storybook/{main.ts,preview.ts,vitest.setup.ts}`: stories, modes, a11y, viewport, and Argos integration.
- `.github/workflows/ci.yml`: authoritative CI sequencing.
- `README.md`, `docs/theme-packages.md`, `docs/visual-testing.md`: public behavior and QA contracts.

## Runtime/Tooling Preferences

Use Node.js `>=22` (CI uses 24) and pinned `pnpm@11.3.0`. The package is ESM-only and requires Svelte `^5` as a peer dependency. Do not substitute Bun, npm, or yarn for repository scripts. TypeScript targets ES2022 with `verbatimModuleSyntax`, `rewriteRelativeImportExtensions`, and `noEmit`. `pnpm run build` requires Python FontTools' `pyftsubset`; browser QA requires Playwright Chromium.

Expected noise: font subsetting may print `PfEd NOT subset`; publint must still finish with `All good`. Unit tests can print jsdom `Could not parse CSS stylesheet`; judge the final Vitest summary. Three known Svelte warnings exist in Tooltip, Modal, and Sheet—do not add more.

## Testing & QA

- Vitest has two projects in `vitest.config.ts`: `unit` uses jsdom and Testing Library; `storybook` uses Playwright Chromium, Storybook, axe checks, light/dark modes, and Argos.
- Keep `vitest-setup.ts` polyfills intact: the Map-backed `localStorage` and `Element.animate` stub are required for persistence and transition tests.
- Test observable behavior and failure paths: missing browser APIs, rejected promises, rapid repeats, pending unmount, invalid controlled values, stale async completion, accessibility relationships, and native element behavior.
- `scripts/generated.test.mjs` guards committed generated artifacts. Token-source changes are incomplete until regeneration and drift tests pass.
- User-visible component/token changes require deterministic stories in both themes; avoid time, locale, and randomness. Clear inherited `CI` locally to prevent Argos uploads.
- Before finishing a permanent change, run focused tests, then `pnpm run check`, `pnpm test`, and the relevant build/visual gates. Type-check or execute documentation examples; keep README claims and plan checkboxes synchronized with behavior.
