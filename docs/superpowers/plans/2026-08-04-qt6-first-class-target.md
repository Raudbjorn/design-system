# Qt 6 First-Class Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` and execute the checkboxes in order.

**Goal:** Make `@svnbjrn/design` a first-class Qt 6 target by adding a 23rd semantic color (`info`), a built-in warm-dark `amber` theme, generated QPalette JSON, a public pure emitter, a lazy-import PySide6 helper, a vendoring installer, and synchronized documentation.

**Architecture:** DTCG color files remain the single source of truth. The existing preparation pipeline feeds pure emitters; `scripts/build-tokens.mjs` alone writes committed outputs; byte-equality tests prevent drift. Qt applies a Fusion style, then a generated QPalette underlay, then generated app-wide QSS; the Python helper preflights artifacts before mutating the application and imports PySide6 only inside Qt-dependent functions.

**Tech stack:** Node.js `>=22` (CI 24), pinned `pnpm@11.3.0`, TypeScript with native type stripping, Vitest, Rust/ratatui, Bash, Python `>=3.10` with stdlib-only helper imports, and PySide6 `>=6.5` only at runtime.

## Context

Implement this in `/home/svnbjrn/dev/projects/qt6-design-system`, the clean `@svnbjrn/design` checkout at `b6ff808`; do not modify the sibling `ture` application. Preserve the established ExtJS split from `89e5734`: public pure emitter under `src/lib/<target>/`, thin `scripts/emitters/` adapter, build-script-owned I/O, committed generated assets, subpath exports, and drift tests. Every token/theme task must regenerate and commit all changed generated outputs before the next task, because later Qt artifacts consume the expanded contract.

Use lowercase six-digit colors throughout generated Qt JSON. Generated files are never hand-edited. Use specific `git add <explicit-path-list>` commands, never `git add -A`/`.`; do not amend or bypass hooks. User-visible token/theme changes require deterministic Storybook coverage in dark, light, and amber. Existing expected noise remains: three Svelte warnings (Tooltip, Modal, Sheet), jsdom stylesheet parse messages, and `PfEd NOT subset`; only command exit status and publint’s final `All good` determine success.

## Approach

### 1. Expand the semantic color contract from 22 to 23 keys

This step is foundational; every later task depends on it.

- [ ] **Pin the new contract in tests before changing sources.**
  - In `src/lib/tokens/parity.test.ts`, add `info: '#6fa8c7'` after `warning` in `GOLDEN_DARK` and `info: '#205d7d'` after `warning` in `GOLDEN_LIGHT`.
  - In `src/lib/tokens/palette.test.ts`, add `'info'` after `'warning'` in `SEMANTIC_TEXT_TOKENS`.
  - In `scripts/generated.test.mjs`, append `'info'` after `'syn-number'` in `TUI_COLOR_FIELDS`; this must mirror the emitter order so the new role receives the next free sentinel rather than shifting existing syntax sentinels.
  - In `crates/raudbjorn-tui/src/profile.rs`’s `profile_resolves_every_palette_field`, add `resolved.info` after `resolved.warning`.
  - Run `pnpm exec vitest run --project=unit src/lib/tokens/parity.test.ts src/lib/tokens/palette.test.ts scripts/generated.test.mjs` and `pnpm run tui:test`. Expected: failures caused by the missing `info` source/generated/Rust field, not unrelated failures.

- [ ] **Add the DTCG values and both accessibility policies.**
  - In `src/lib/tokens/primitives.tokens.json`, add child entries in the existing `primitive.color` group (the group owns `$type: "color"`; children carry only `$value`):
    - `"steel-300": { "$value": "#6fa8c7" }`
    - `"steel-700": { "$value": "#205d7d" }`
  - In `src/lib/tokens/dark.tokens.json`, insert `"info": { "$value": "{primitive.color.steel-300}" }` immediately after `warning`; do the same in `light.tokens.json` with `steel-700`.
  - In `src/lib/internal/invariants.ts`, add `{ fg: 'info', bg: 'bg', floor: 3, tier: 'extension' }` after the warning rule. This is the world-package compatibility floor.
  - In `src/lib/theme/theme.ts`, add `{ fg: 'info', bg: 'bg', min: 4.5 }` and `{ fg: 'info', bg: 'surface-2', min: 4.5 }` after the warning gates. This is the component-aware normal-text policy used by Alert.
  - In `src/lib/generate/generate.ts`, add `info: { h: 235, c: 0.12, cFloor: 0.08 }` to `STATUS_ANCHORS`. It intentionally follows the existing status solver’s `ACCENT_AIM`/`ACCENT_FLOOR`; do not create separate Qt generation logic.

- [ ] **Propagate `info` through every fixed target projection.**
  - Append `'info'` at the end of `scripts/emitters/emit-tui-rust.mjs`’s `fields` array, after `'syn-number'`, so it maps to sentinel `(170, 0, 22)` without shifting any existing field index.
  - Add `pub info: Color` after `warning` in `crates/raudbjorn-tui/src/theme/mod.rs`; preserve every existing sentinel mapping `(170,0,0)…(170,0,21)` and add only `(170, 0, 22) => Some(self.info)`. Do not renumber syntax sentinels.
  - Add `info: quantize_color(palette.info, profile)` after warning in `resolve_palette()` in `crates/raudbjorn-tui/src/profile.rs`.
  - Add the one-line emitter rule `QLabel[class="info"] { color: ${c('info')}; }` after warning in `scripts/emitters/emit-qss.mjs`, matching the existing one-line status-rule style.
  - Change Alert’s `[data-tone='info']` mapping in `src/lib/components/atoms/Alert.svelte` from `var(--sv-accent)` to `var(--sv-info)`.
  - Add `info` to the status arrays in `src/stories/foundations/Colors.stories.svelte` and `src/Dev.svelte`; add `--sv-info: #6fa8c7` to both plain/tokenized dark excerpts, and correct the touched status literals to the current generated dark values (`success #74a55e`, `error #ff5b48`, `warning #ffa500`) so each plain/tokenized pair keeps matching line-for-line.
  - Add `'info'` after `'warning'` in `.design-sync/react-adapter/index.d.ts`’s hand-maintained `TokenName` union.

- [ ] **Update the status contract documentation in the same change.**
  - `docs/theme-packages.md`: add `info` to the 3:1-on-`bg` extension rule and explain that an override of `bg` can now revert `info` just like success/error/warning.
  - `docs/bones-integration.md`: change both status-lock examples to `lockedTokens: ['success', 'error', 'warning', 'info']`.
  - `.design-sync/conventions.md`: add `--sv-info` to the semantic color table/list.

- [ ] **Regenerate; do not edit outputs manually.** Run `pnpm run tokens`. The changed committed outputs must be exactly:
  - `src/lib/tokens/colors.css`, `src/lib/tokens/palette.ts`, `src/lib/tokens/resolved/dark.tokens.json`, `src/lib/tokens/resolved/light.tokens.json`
  - `src/lib/qss/dark.qss`, `src/lib/qss/light.qss`
  - `src/lib/extjs/theme-sv-dark.css`, `src/lib/extjs/theme-sv-light.css`
  - `crates/raudbjorn-tui/src/theme/generated.rs`
  Inspect the diff to confirm `TokenName` has 23 members and no unrelated scale/font output changed.

- [ ] **Verify the contract before committing.** Run:
  ```bash
  pnpm run check
  pnpm test
  pnpm run tui:check
  pnpm run tui:test
  pnpm run tui:smoke
  CI= pnpm run test:visual
  ```
  Expected: unit/generation/parity/drift tests pass; Rust builds/tests/determinism pass; Colors and Alert render the new info color in both current modes with no new Svelte warning.

- [ ] **Commit the isolated contract expansion** as `feat(tokens): add info status token across the 23-key contract`, staging only the source, tests, docs, adapter, Rust files, and generated outputs enumerated above.

### 2. Add the built-in explicit `amber` theme

Depends on step 1’s 23-key contract. Amber is explicit through `data-theme="amber"`; it is not added to `ThemeMode` or world-package `extends`.

- [ ] **Add failing amber expectations first.**
  - In `src/lib/tokens/parity.test.ts`, add `GOLDEN_AMBER` with the exact 23 values below, add a DTCG resolution assertion for `amber.tokens.json`, include amber in the identical-key-set assertion, and assert `[data-theme="amber"]` equals the golden record.
  - In `src/lib/tokens/palette.test.ts`, import `amber` and `palettes`; iterate `Object.entries(palettes)` for shared invariant checks; run the primary-background 4.5 semantic-text check against both `{ dark, amber }`; retain the light-only full-paper-ramp check; compare every palette’s key set to dark.
  - In `scripts/generated.test.mjs`, extend the dark-icon test with `expect(byName.amber).toMatch(/--sv-icon-filter: invert\(1\)/)`.
  - Run the three focused unit files. Expected: amber import/source/selector/output failures.

- [ ] **Create `src/lib/tokens/amber.tokens.json` with the exact current DTCG shape.** Use a top-level description, a `color` group with `$type: "color"`, and these keys in the same order as dark/light:

  | Token | Value in the DTCG file |
  | --- | --- |
  | `bg` | `#0f0e0d` |
  | `surface-1` | `#1a1815` |
  | `surface-2` | `#221f1a` |
  | `surface-3` | `#2b271f` |
  | `border` | `#332e26` |
  | `text` | `#e2d9c8` |
  | `text-strong` | `{primitive.color.paper-100}` → `#f1e7c4` |
  | `text-muted` | `#a89c86` |
  | `text-faint` | `#948a76` |
  | `accent` | `#d4a017` |
  | `accent-2` | `{primitive.color.coral-300}` → `#e06c75` |
  | `accent-rust` | `{primitive.color.rust-300}` → `#ce9178` |
  | `mix-target` | `{primitive.color.white}` → `#ffffff` |
  | `success` | `#86b86b` |
  | `error` | `#e4635a` |
  | `warning` | `#e08a2b` |
  | `info` | `{primitive.color.steel-300}` → `#6fa8c7` |
  | `syn-keyword` | `#6ea7dd` |
  | `syn-string` | `#d29a6a` |
  | `syn-var` | `#9ec7e8` |
  | `syn-func` | `#d9c78a` |
  | `syn-comment` | `#8faf72` |
  | `syn-number` | `#b3c99a` |

  These exact values have been checked against every current `CONTRAST_RULES` rule and every component-aware 4.5 pair at the pinned checkout; regeneration must pass without changing them. A failure means the checkout no longer matches the grounded base or the implementation is wrong—diagnose that discrepancy rather than weakening a gate or improvising a new palette.

- [ ] **Register and expose amber without widening mode/base machinery.**
  - Append `{ name: 'amber', files: ['amber.tokens.json'] }` in `src/lib/tokens/themes.ts`; do not set `default` or `prefersColorScheme`.
  - Add `amber` to the root palette export in `src/lib/index.ts` and assert `ds.amber` in `src/lib/index.test.ts`.
  - Add amber to `.design-sync/react-adapter/index.js`’s palette pass-through, declare `export const amber: Palette`, and change `ThemeRootProps.theme` to `'dark' | 'light' | 'amber'` in `index.d.ts`. `wrap.js` already passes the string through and must remain unchanged.
  - Update `.design-sync/NOTES.md` and adapter comments that enumerate built-in palettes.
  - Do not change `src/lib/theme/boot.ts` (`ThemeMode = 'dark' | 'light' | 'system'`), `src/lib/theme/types.ts` (`extends: 'dark' | 'light'`), `DefineThemeOptions.base`, or generator `Mode`.

- [ ] **Add amber to visual coverage and correct the stale count.**
  - `.storybook/preview.ts`: add `amber: 'amber'` to the theme decorator and `amber: allModes.amber` to Argos modes.
  - `.storybook/modes.ts`: add `amber: { theme: 'amber' }`.
  - Update dark/light-only comments in `vitest.config.ts` and `.github/workflows/ci.yml` without enabling the currently disabled Argos job.
  - `docs/visual-testing.md`: document the verified 72 explicit Svelte stories × 3 modes = **216 screenshots**, about 23 complete builds under a 5,000-screenshot quota, `mode-[amber]` suffixes, and that `CI= pnpm run test:visual` is the active local gate while the workflow job remains disabled.

- [ ] **Regenerate and synchronize public inventories.** Run `pnpm run tokens`. Expect new `src/lib/tokens/resolved/amber.tokens.json`, `src/lib/qss/amber.qss`, `src/lib/extjs/theme-sv-amber.css`, an `AMBER` constant in `crates/raudbjorn-tui/src/theme/generated.rs`, and amber blocks in `src/lib/tokens/colors.css` and `src/lib/tokens/palette.ts`.
  - Update `README.md`, `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` from blanket dark/light output wording to “dark, light, and explicit amber,” while preserving dark/light/system mode wording.
  - Add the amber sheet to `docs/extjs-integration.md` and replace “both sheets” with “all three sheets.”
  - In `docs/theme-packages.md`, explicitly state that `amber` is a static built-in but world packages still extend only dark or light.

- [ ] **Verify and commit.** Run `pnpm run check`, `pnpm test`, `pnpm run tui:check`, `pnpm run tui:test`, `pnpm run tui:smoke`, and `CI= pnpm run test:visual`. Inspect Colors and Alert under amber and confirm the visual run covers 216 mode/story combinations. Commit as `feat(tokens): add built-in warm-dark amber theme`, staging only the files named in this subsection and generated amber outputs.

### 3. Add the published QPalette JSON emitter and generated artifacts

Depends on dark/light/amber all carrying the same 23-key palette.

- [ ] **Write the failing emitter/build contract in `scripts/generated.test.mjs`.** Import `emitQtPalette`/`QT_ROLES` from `../src/lib/qt/emit.ts` and `emitQt` from `./emitters/emit-qt.mjs`; inside the existing per-theme drift loop compare `src/lib/qt/<name>.palette.json` byte-for-byte with `emitQt(theme)`. Add tests that, for every prepared theme:
  - top-level keys and marker are exact;
  - `groups` contains exactly `active`, `inactive`, `disabled`;
  - every group has exactly all 14 `QT_ROLES`;
  - `status` has exactly `success`, `error`, `warning`, `info`, `success-bg`, `error-bg`, `warning-bg`, `info-bg`;
  - every color is lowercase `^#[0-9a-f]{6}$`, no `${`, `undefined`, or `NaN` leaks;
  - policy mappings are pinned (`active.Window = bg`, `active.Base = surface-1`, `active.Highlight = accent`, disabled text = `text-faint`, inactive Highlight is mixed, status `info = palette.info`);
  - dark and amber report `meta.isDark === true`, light reports false;
  - a missing required mapped token, an uppercase/non-hex mapped token, and an unsafe theme name throw errors naming the offending input.
  Run `pnpm exec vitest run --project=unit scripts/generated.test.mjs`; expected failure is the absent Qt modules/artifacts.

- [ ] **Create the public pure emitter.**
  - `src/lib/qt/emit.ts` exports:
    ```ts
    export const QT_ROLES = [
      'Window', 'WindowText', 'Base', 'AlternateBase', 'Text', 'Button', 'ButtonText',
      'ToolTipBase', 'ToolTipText', 'Highlight', 'HighlightedText', 'PlaceholderText',
      'Link', 'BrightText'
    ] as const;

    export interface QtPaletteInput {
      name: string;
      palette: Readonly<Record<string, string>>;
    }

    ```
  - Implement `emitQtPalette` as an exported const with public type `(input: QtPaletteInput) => string`; destructure `{ name, palette }` inside the implementation.
  - Reuse `mixOklab(hexA, hexB, weightB)` from `src/lib/internal/color.ts` and `contrastRatio(a, b)` from `src/lib/internal/contrast.ts`; do not duplicate color math or import private `prepareBuild` shapes.
  - Validate `name` with `^[a-z][a-z0-9-]{0,63}$` before reading colors; throw `emitQtPalette: invalid theme name "<name>"` so every public-emitter output is accepted by the Python schema and safe for the build’s filename stem.
  - A local `c(key)` must throw `emitQtPalette: missing color token "<key>"` or `emitQtPalette: token "<key>" is not #rrggbb: "<value>"` before color math. The regex is strict lowercase `^#[0-9a-f]{6}$`.
  - Compute `isDark` as white having higher contrast against `bg` than black; describe that rule accurately rather than claiming it compares `bg` with `text`.
  - Build the role maps in this exact policy order:
    - active: `Window=bg`, `WindowText=text`, `Base=surface-1`, `AlternateBase=surface-2`, `Text=text`, `Button=surface-2`, `ButtonText=text`, `ToolTipBase=surface-3`, `ToolTipText=text-strong`, `Highlight=accent`, `HighlightedText=bg`, `PlaceholderText=text-faint`, `Link=accent`, `BrightText=#ffffff`;
    - inactive: active plus `Highlight=mixOklab(accent, surface-3, 0.5)`;
    - disabled: active plus `WindowText/Text/ButtonText=text-faint`, `Base=bg`, `Button=surface-1`, `Highlight=surface-3`, `HighlightedText/Link=text-muted`.
  - Emit status foregrounds directly and `*-bg = mixOklab(status, bg, 0.85)` (85% toward `bg`). Return two-space `JSON.stringify` with one trailing newline and this fixed top-level order:
    `$generated: 'by scripts/build-tokens.mjs — do not edit'`, `name`, `meta: { isDark }`, `groups`, `status`.
  - `src/lib/qt/index.ts` re-exports `emitQtPalette`, `QT_ROLES`, and `QtPaletteInput`; it is the `@svnbjrn/design/qt` barrel. Do not add a root-barrel emitter export and do not add `design-generate --qt`.

- [ ] **Add the thin adapter and I/O wiring.**
  - `scripts/emitters/emit-qt.mjs` contains only `emitQt(theme) => emitQtPalette({ name: theme.name, palette: theme.paletteHex })`, matching `emit-extjs.mjs`, not the private QSS emitter.
  - In `scripts/build-tokens.mjs`, import `emitQt`, create `QT_DIR = join(TOKENS_DIR, '../qt')`, `mkdirSync` it, add the Qt output to the header list, and append one `${theme.name}.palette.json` output per prepared theme. `scripts/build-tokens.mjs` remains the only writer.
  - Run `pnpm run tokens`; expect committed `src/lib/qt/dark.palette.json`, `light.palette.json`, and `amber.palette.json`.

- [ ] **Publish the module/assets.** Add to `package.json`:
  ```json
  "./qt": { "types": "./dist/qt/index.d.ts", "default": "./dist/qt/index.js" },
  "./qt/*.json": "./dist/qt/*.json"
  ```
  Update generated-output inventories in `README.md`, `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` to include `src/lib/qt/*.palette.json`.

- [ ] **Verify and commit.** Run the focused generated test, then `pnpm test`, `pnpm run check`, and `pnpm run build`. Require publint `All good` and confirm `dist/qt/index.js`, `dist/qt/index.d.ts`, and all three `dist/qt/*.palette.json` files exist. Commit as `feat(qt): emit QPalette JSON per theme`, staging the new `src/lib/qt` files, adapter, build/test/package changes, and synchronized inventories.

### 4. Add the lazy-import PySide6 runtime helper

Depends on the exact JSON schema from step 3. No PySide6 package is added to Node dependencies or imported when the module loads.

- [ ] **Write `scripts/qt-runtime.test.mjs` before the helper.** Use real `python3` subprocesses and the importlib `spec_from_file_location` pattern. Tests must:
  - set `sys.modules['PySide6'] = None` before importing the module and prove import still prints `ok`;
  - parse all three committed palette JSON files;
  - reject invalid JSON, a non-object root, wrong/extra top-level fields, a bad marker/name/meta shape, missing/extra groups, missing/extra roles, missing/extra status keys, and a non-hex value (mutate an otherwise valid generated document so each failure is isolated);
  - inject a fake `PySide6.QtGui` module in `sys.modules` and assert `palette_from_json()` issues 42 `setColor` calls (3 groups × 14 roles), with no silently skipped role;
  - use fake app methods to assert `apply()` pre-reads both files and then calls `setStyle('Fusion')`, `setPalette`, `setStyleSheet` in that order; a missing QSS or invalid palette produces no app mutation;
  - use a fake widget/style to assert `set_variant()` order: `setProperty`, `unpolish`, `polish`, `update`;
  - assert `watch_color_scheme()` returns false without `colorSchemeChanged`, and connects the supplied callback exactly once when present;
  - fake `QFontDatabase` to assert sorted `.ttf`, `.otf`, `.woff2` loading, ignored unrelated suffixes, skipped `-1` IDs, and returned family names.
  Run the focused test; expected failure is the missing helper.

- [ ] **Create `bin/sv_design_qt.py` with the exact public functions** `parse_palette(text: str) -> dict`, `palette_from_json(path: str | Path)`, `apply(app, qss_path: str | Path, palette_path: str | Path) -> None`, `set_variant(widget, value: str, prop: str = \"class\") -> None`, `watch_color_scheme(app, callback) -> bool`, and `load_fonts(directory: str | Path) -> list[str]`. Module-scope imports are limited to `json`, `re`, and `pathlib.Path`. A private `_qt_gui()` performs the lazy `PySide6.QtGui` import and converts a missing PySide6 package into `RuntimeError('PySide6 >= 6.5 is required for Qt runtime functions')`.

- [ ] **Make `parse_palette()` a closed-schema validator.** It must require exactly the top-level keys `$generated`, `name`, `meta`, `groups`, `status`; exact marker text; a safe nonempty lowercase kebab-case name; `meta` containing exactly boolean `isDark`; exact groups `active/inactive/disabled`; exactly the 14 Qt role names from step 3 in each group; exactly the eight status keys; and lowercase six-digit colors everywhere. Collect all structural/value issues that can safely be inspected and raise one `ValueError('palette JSON: ' + '; '.join(issues))`; invalid JSON/non-object roots raise a single precise `ValueError` immediately. Never accept missing `status` as `{}` and never silently skip an unknown role.

- [ ] **Implement the Qt-dependent behavior without partial mutation.**
  - `palette_from_json()` reads UTF-8, validates, maps explicit `QPalette.ColorGroup.Active/Inactive/Disabled`, resolves every `QPalette.ColorRole` by exact name, and calls `setColor(group, role, QColor(value))`; a missing enum member raises a clear runtime error mentioning PySide6 `>=6.5`.
  - `apply()` reads the QSS text and constructs the validated QPalette before the first app method, then calls Fusion → palette → stylesheet exactly once each.
  - `set_variant()` uses the already documented QSS idiom without resetting the whole stylesheet.
  - `watch_color_scheme()` connects `QStyleHints.colorSchemeChanged` when available and returns true; it returns false without raising on older bindings. The consumer callback owns dark/light artifact selection and reapplication.
  - `load_fonts()` scans one directory level in sorted order for `.ttf`, `.otf`, `.woff2`, calls `addApplicationFont`, ignores `-1`, and concatenates `applicationFontFamilies(id)` results. It is best-effort and returns `[]` when Qt accepts none, allowing the QSS system-font fallback.

- [ ] **Run the focused and full unit gates.** `pnpm exec vitest run --project=unit scripts/qt-runtime.test.mjs`, then `pnpm test`. All helper behavior above must be covered without real PySide6.

- [ ] **Commit** `bin/sv_design_qt.py` and `scripts/qt-runtime.test.mjs` as `feat(qt): add PySide6 runtime helper`.

### 5. Add the narrow vendoring installer

Depends on built artifacts and the helper. Keep the requested copy-only CLI; do not import Proxmox’s install/uninstall/status/register behavior.

- [ ] **Write `scripts/qt-install.test.mjs` first.** Follow `scripts/proxmox-install.test.mjs`’s real `spawnSync`/temporary-fixture convention, but clean temporary roots in `afterEach`. Cover:
  - flat `--from` fixture success copying `sv_design_qt.py`, `<theme>.qss`, and `<theme>.palette.json` into an existing destination;
  - `--fonts` copies every fixture `.woff2` into `dest/sv-fonts`, while omission leaves no `sv-fonts` directory;
  - package-root `dist/{qss,qt,fonts}` resolution, source-root `src/lib/{qss,qt,fonts}` fallback, direct flat-root resolution, and dist-first precedence;
  - dark/light/amber filename stems with no `theme-` prefix;
  - idempotent overwrite after source bytes change;
  - `--help` exits 0; invalid/missing/duplicate arguments and unsafe theme names exit 2;
  - unknown theme/incomplete layout, missing destination, and requested-but-empty fonts exit 1 before creating/copying any destination file; exercise the missing-helper branch by running a fixture copy of the installer from a temporary `bin/` directory that deliberately omits its sibling `sv_design_qt.py`;
  - unrelated destination files survive every success/failure.
  Run the focused test; expected failure is the absent script.

- [ ] **Create executable `bin/qt-theme-install.sh` with exact CLI:**
  ```text
  qt-theme-install.sh --theme <name> --dest <existing-dir> [--from <root>] [--fonts]
  ```
  Use `set -euo pipefail`, `usage`, `die`, and stderr diagnostics. `--help` exits 0; syntax errors exit 2; preflight/filesystem errors exit 1. Reject duplicate flags and theme names outside `^[a-z][a-z0-9-]{0,63}$`. `--dest` must already be an existing writable directory; never default to `$PWD` or create the destination root.

- [ ] **Lock source resolution and copy behavior.**
  - The helper source is always `bin/sv_design_qt.py` beside the installer; fail if absent/unreadable.
  - `--from` defaults to the package root (`dirname(installer)/..`). Resolve one complete artifact root in order: `<root>/dist`, `<root>/src/lib`, then `<root>` for a flat fixture/direct artifact root. A candidate is complete only when it contains `qss/<theme>.qss` and `qt/<theme>.palette.json`; never mix files from candidates.
  - With `--fonts`, require at least one matching WOFF2 file and require every matched `<candidate>/fonts/*.woff2` file to be readable before copying. Without it, do not inspect/create a font destination.
  - Complete all checks before any `cp`/`mkdir`. Then copy the helper, QSS, and palette flat into `dest`; with fonts, create `dest/sv-fonts` and copy all WOFF2 files. Use overwrite semantics and a same-file guard so repeated installation is exit 0 and byte-stable. Copy no unrelated artifact and delete nothing.

- [ ] **Verify and commit.** Run the focused installer test and `pnpm test`; run `bash -n bin/qt-theme-install.sh`; confirm executable mode. Commit as `feat(qt): add vendoring installer for Python projects`, staging only the script and its test.

### 6. Publish the Qt integration contract and finish cross-surface documentation

Depends on all behavior being implemented and package-built.

- [ ] **Create `docs/qt-integration.md` using the existing ExtJS guide’s production shape.** Include:
  - “What ships”: `@svnbjrn/design/qss/{dark,light,amber}.qss`, `@svnbjrn/design/qt/{dark,light,amber}.palette.json`, `@svnbjrn/design/qt`, `bin/sv_design_qt.py`, `bin/qt-theme-install.sh`, optional fonts;
  - installer invocation into an importable Python package directory;
  - complete `QApplication` setup using `load_fonts()` then `apply()`, with Fusion → palette → QSS rationale and QSS conflict precedence;
  - `set_variant()` usage instead of duplicating repolish calls;
  - `watch_color_scheme()` usage that selects dark/light and re-runs `apply()` from immutable artifacts rather than reading the live palette; amber remains explicit;
  - font return-value/fallback behavior;
  - pure emitter usage from `@svnbjrn/design/qt`;
  - regeneration/drift commands and the distinction between Qt palette JSON and broader `tokens/resolved/*.tokens.json`.

- [ ] **State Qt’s real limitation, not the stronger supplied claim.** Official Qt documentation warns against combining `QApplication.setPalette()` with style sheets and notes that native platform styles may ignore palette roles. Document QPalette as a deliberate best-effort underlay for QSS-unset Qt-owned widgets; do not promise menu coverage (the existing QSS already styles `QMenu`) or native-dialog theming. Cite `https://doc.qt.io/qt-6/qapplication.html#setPalette` and `https://doc.qt.io/qt-6/qpalette.html`.

- [ ] **Replace stale integration snippets and claims.**
  - `docs/bones-integration.md`: replace raw QSS-only PySide6 instructions with the helper/installer example and link to the Qt guide; keep resolved JSON only for advanced scale/derived-token use.
  - `README.md`: add Qt emitter/palette/helper/installer entries, list amber artifacts, and retain explicit dark/light/system mode language.
  - Final-sweep `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.design-sync/NOTES.md`, `.design-sync/conventions.md`, `docs/theme-packages.md`, `docs/extjs-integration.md`, `docs/visual-testing.md`, `.storybook` comments, `vitest.config.ts`, and CI comments for stale “both themes/sheets,” missing `info`, missing Qt outputs, or incorrect 40/80/120 screenshot counts. Do not enable Argos or widen world-base/mode types.

- [ ] **Execute every new Qt code example.** Pure Python/import/schema examples must be represented in `scripts/qt-runtime.test.mjs`; installer examples in `scripts/qt-install.test.mjs`; emitter examples in `scripts/generated.test.mjs`. The real Qt widget snippet must be exercised by the offscreen smoke in Verification. Remove or label any illustrative snippet that still depends on undefined variables; do not call it executable.

- [ ] **Run the documentation example tests and package gate, then commit.** Run `pnpm exec vitest run --project=unit scripts/generated.test.mjs scripts/qt-runtime.test.mjs scripts/qt-install.test.mjs`, `pnpm run check`, and `pnpm run build`; commit as `docs(qt): add Qt 6 integration guide`, staging the new guide and only the documentation/comment files changed by this subsection. After that commit, run the complete Verification section against the clean tree; any correction is a new scoped commit, never an amend.

## Critical files & anchors

- `src/lib/extjs/emit.ts` and `scripts/emitters/emit-extjs.mjs` — the published pure-emitter/thin-adapter pattern Qt must copy; avoid the private prepared-theme API used by `emit-qss.mjs`.
- `scripts/build-tokens.mjs` — sole I/O owner for committed generated outputs and the source-side path that `svelte-package` copies into `dist`.
- `scripts/generated.test.mjs` — existing per-theme byte-drift loop, TUI projection list, and correct home for the Qt emitter/schema contract.
- `bin/sv_design_qt.py` — closed JSON validator and only Python runtime boundary; module import must remain stdlib-only.
- `bin/qt-theme-install.sh` — copy-only vendoring boundary with fixed layout precedence and preflight-before-write semantics.

## Verification

Run from `/home/svnbjrn/dev/projects/qt6-design-system` after all six commits unless a step explicitly names a focused gate.

1. **Generated drift:**
   ```bash
   pnpm run tokens
   git status --short
   ```
   Expected: no tracked or untracked change. All dark/light/amber CSS, resolved JSON, QSS, ExtJS, Qt JSON, and Rust artifacts are byte-stable.

2. **Enabled CI-equivalent and package gates:**
   ```bash
   pnpm run check
   pnpm test
   pnpm run build
   ```
   Expected: check exits 0 with only the three known warnings; all unit projects/tests pass, including `generated`, `qt-runtime`, and `qt-install`; build ends with publint `All good`. Confirm these exact files exist: `dist/qt/index.js`, `dist/qt/index.d.ts`, `dist/qt/{dark,light,amber}.palette.json`, `dist/qss/{dark,light,amber}.qss`, `dist/extjs/theme-sv-{dark,light,amber}.css`, and `dist/tokens/resolved/{dark,light,amber}.tokens.json`.

3. **Rust target:**
   ```bash
   pnpm run tui:check
   pnpm run tui:test
   pnpm run tui:smoke
   ```
   Expected: `TerminalPalette.info` compiles/quantizes, `(170,0,22)` resolves to info without changing earlier sentinels, `AMBER` is generated, and determinism passes.

4. **Visual behavior:** install Chromium once with `pnpm exec playwright install chromium`, then run:
   ```bash
   CI= pnpm run test:visual
   pnpm run build-storybook
   ```
   Expected: 72 explicit stories render in dark/light/amber (216 mode/story captures), no Argos upload, no new Svelte warning. Inspect Colors’ info chip and all Alert tones in amber, dark, and light.

5. **Real PySide6 offscreen smoke:** run this complete scratch-environment probe:

   ```bash
   set -euo pipefail
   qtvenv="$(mktemp -d)"
   trap 'rm -rf "$qtvenv"' EXIT
   uv venv "$qtvenv"
   uv pip install --python "$qtvenv/bin/python" 'PySide6>=6.5'
   REPO="$PWD" QT_QPA_PLATFORM=offscreen "$qtvenv/bin/python" - <<'PY'
   import importlib.util
   import json
   import os
   from pathlib import Path

   from PySide6.QtGui import QPalette
   from PySide6.QtWidgets import QApplication, QPushButton

   repo = Path(os.environ["REPO"])
   helper_path = repo / "bin/sv_design_qt.py"
   spec = importlib.util.spec_from_file_location("sv_design_qt", helper_path)
   module = importlib.util.module_from_spec(spec)
   assert spec.loader is not None
   spec.loader.exec_module(module)

   app = QApplication([])
   families = module.load_fonts(repo / "src/lib/fonts")
   for name in ("dark", "light", "amber"):
       palette_path = repo / "src/lib/qt" / f"{name}.palette.json"
       qss_path = repo / "src/lib/qss" / f"{name}.qss"
       doc = module.parse_palette(palette_path.read_text(encoding="utf-8"))
       module.apply(app, qss_path, palette_path)
       assert app.style().objectName().lower() == "fusion"
       for role_name in ("Window", "Text", "Highlight"):
           role = getattr(QPalette.ColorRole, role_name)
           actual = app.palette().color(QPalette.ColorGroup.Active, role).name()
           assert actual == doc["groups"]["active"][role_name], (name, role_name, actual)

   button = QPushButton("Probe")
   module.set_variant(button, "primary")
   assert button.property("class") == "primary"
   assert module.watch_color_scheme(app, lambda _scheme: None) is True
   print(json.dumps({"themes": 3, "fontFamilies": families}))
   PY
   ```

   Expected: no exception, Fusion remains active, and all three active-role samples round-trip. `fontFamilies` may be empty when Qt rejects the bundled WOFF2 files; the QSS system-font fallback is the specified behavior and documentation must not claim those families loaded.

6. **Installer against the real build layout:**
   ```bash
   set -euo pipefail
   dest="$(mktemp -d)"
   trap 'rm -rf "$dest"' EXIT
   bash bin/qt-theme-install.sh --theme amber --dest "$dest" --from . --fonts
   cmp bin/sv_design_qt.py "$dest/sv_design_qt.py"
   cmp dist/qss/amber.qss "$dest/amber.qss"
   cmp dist/qt/amber.palette.json "$dest/amber.palette.json"
   SV_QT_DEST="$dest" python3 -c 'import importlib.util, os, pathlib; p=pathlib.Path(os.environ["SV_QT_DEST"]); s=importlib.util.spec_from_file_location("sv_design_qt", p/"sv_design_qt.py"); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); m.parse_palette((p/"amber.palette.json").read_text(encoding="utf-8"))'
   ```
   Expected: exit 0, byte-identical helper/QSS/palette, copied WOFF2 files under `sv-fonts`, and pure parsing succeeds without PySide6.

## Assumptions & contingencies

- `amber` is intentionally a static built-in selected by `data-theme="amber"`; `ThemeMode` remains `'dark' | 'light' | 'system'`, generator/world `Mode` remains dark/light, and world packages continue to `extends: 'dark' | 'light'`. Storybook’s amber mode is a visual-test preset, not persisted application mode.
- The published emitter prepares compiled-in and already-resolved palettes only. `design-generate --qt`, Qt world-theme folding, QML/QtQuick, QProxyStyle, icon recoloring, and a TUI gallery amber toggle are not added; the new `@svnbjrn/design/qt` API is the prepared extension point.
- Qt’s official docs explicitly caution that palette/style-sheet combinations and native platform engines are not fully portable. The implementation keeps the chosen underlay order, but completion claims are limited to emitted role correctness, Qt-owned widget smoke results, and QSS behavior; native-dialog appearance is platform-owned.
- Font copying/loading is opt-in and best-effort because the repository ships WOFF2 only. A failed Qt font registration returns no families and falls back through the existing QSS font stack; it does not abort theme application.
