# Copilot repository instructions

Trust this file for the repository map and validated commands. Search only when a task needs details not covered here or these instructions conflict with the current tree.

## Repository and toolchain

`@svnbjrn/design` is a dark-first Svelte 5 component/design-token library: 28 core components, dark/light and runtime world themes, vernacular parsing, deterministic theme generation, generated CSS/JSON/QSS, self-hosted fonts, and opt-in Vermis/Carter visual languages. It uses Svelte 5 runes/snippets, TypeScript, CSS custom properties, and no utility-class framework.

- Node.js `>=22` is required; CI uses Node 24. Use pinned `pnpm@11.3.0`.
- Always bootstrap with `pnpm install --frozen-lockfile`.
- Run focused tests while iterating, then relevant full gates:

```bash
pnpm run check                         # svelte-check
pnpm test                              # src + scripts unit tests, jsdom
pnpm run build                         # tokens, fonts, package, publint
pnpm exec playwright install chromium  # once per machine
CI= pnpm run test:visual               # browser story suite; no upload
pnpm run build-storybook
```

`pnpm run build` requires `pyftsubset` from Python FontTools. It rewrites committed token/QSS outputs and subsets fonts; `PfEd NOT subset` is expected, but publint must report `All good`. Unit tests may print jsdom `Could not parse CSS stylesheet` noise; judge the final Vitest summary. Three known Svelte warnings currently exist in Tooltip, Modal, and Sheet; do not add more.

The visual project uploads to Argos whenever `CI` is truthy, so explicitly clear inherited `CI` locally. CI (`.github/workflows/ci.yml`) runs install/check/unit tests, then Chromium visual tests, Storybook build, and Argos deploy. Argos HTTP 402 “maximum screenshot capacity” is account quota after tests, not a product defect; do not suppress it in code.

## Project map and sources of truth

- `src/lib/components/{atoms,layout,molecules}`: core components with colocated tests; `src/lib/index.ts` is the public barrel.
- `src/stories`: Storybook stories; each is a dark/light visual regression test.
- `src/lib/theme`, `vernacular`, and `generate`: runtime theme handling, hostile-input string catalogs, and the seed-to-theme solver.
- `src/lib/vermis` and `src/lib/carter`: isolated opt-in systems. Never leak their `--layform-*`/`--carter-*` tokens into core `--sv-*`.
- `src/lib/tokens/*.tokens.json` plus `themes.ts`: DTCG source of truth. `scripts/build-tokens.mjs` emits `scale.css`, `colors.css`, `palette.ts`, `resolved/*.tokens.json`, and `qss/*.qss`. Never hand-edit outputs; after source edits run `pnpm run tokens` and commit every output. Preserve structured DTCG color/dimension/shadow values.
- `.storybook`, `vitest.config.ts`, and `docs/visual-testing.md`: visual-test contract.
- `.design-sync/react-adapter` and `.design-sync/previews`: committed React bridge. Nothing regenerates its API automatically.
- `README.md`, `docs/theme-packages.md`, and `docs/bones-integration.md`: public contracts.

Style with component props and tokens; use `Stack` for layout. Core cascade order is `sv.base < sv.theme < sv.world < sv.user`.

## Review-derived change rules

### Components and accessibility

- Follow existing Svelte 5 patterns and lowercase callback props (`onclick`). Use `$props.id()` for SSR-stable generated IDs. Preserve explicit label/description/tab/dialog/tooltip/form associations and meaningful accessible names.
- Forward appropriate native attributes and preserve native value types. Do not expose unsupported states such as `multiple` on a string-only Select. Normalize controlled values and non-finite numbers before rendering ARIA values or dimensions.
- Toggle accessible names must remain stable with `aria-pressed`/`aria-checked`, while sighted users also get a visible state. Any accessible-name override must contain the visible label. Preserve selected/checked visuals when disabled.
- Modal, Sheet, Tooltip, and focus-trap changes must affect only the topmost layer, close once on Escape/outside interaction, and retain stacked return-focus targets. Test nested overlays, unmounts, and transitions.
- Public component/prop/event/snippet changes must update every affected surface: implementation/test, `src/lib/index.ts`, story, `.design-sync/react-adapter/{index.js,index.d.ts,wrap.js}`, and owned React preview. Scalar props still need declarations; React camelCase event aliases must match Svelte props.
- Key stateful lists by stable domain identity, never array index.

### Async behavior and tests

- Cancel a prior timer/task before replacing it. Cleanup must also guard code after `await`; use destruction or generation state so late promises cannot mutate unmounted state, create timers, or overwrite newer selections.
- Test missing browser APIs, rejected promises, rapid repeats, pending unmount, invalid controlled values, and stale completion—not only success. A fallback or warning without a behavioral regression test is incomplete.

### Themes and untrusted data

- Gate the foreground/background pairs components actually render, including surfaces—not only token-on-`bg`. Validate custom palettes for completeness, known keys, and six-digit hex before contrast math; validate selectors before CSS interpolation.
- Keep the versioned world-theme rules in `internal/invariants.ts`, component-aware `defineTheme` gates, and stricter built-in-palette tests distinct. Never tighten a published threshold without versioning and updating docs, fixtures, tests, and adapter declarations together.
- Treat theme/vernacular inputs as hostile: bound size before flattening, reject unsupported prototypes/accessors, avoid invoking getters/proxies during reflection, normalize Unicode, and return issue values rather than throw. Duplicate rejection must remove the losing value.
- Scoped previews must inherit from the same base palette used for validation.

### Documentation and completion

- Type-check or execute README examples. Imports, variable scope, disposal, exports, package engines, accessibility constraints, and generated formats must match code.
- Do not claim exported Props, raw-key fallbacks, completed plan steps, or “documentation-only” scope without proof. Keep descriptions and checkboxes synchronized with the diff.
- User-visible component/token changes require deterministic stories and both-theme visual validation; avoid time, locale, and randomness.
