# @svnbjrn/design

[![Covered by Argos Visual Testing](https://argos-ci.com/badge.svg)](https://app.argos-ci.com/argos-ci-2/design-system/reference)

A dark-first, developer-native **Svelte 5** component library — design tokens,
self-hosted fonts, and 13 components. Restrained by design: one primary accent
(teal `#4ec9b0`), one secondary (coral `#e06c75`), a near-black neutral ramp,
and a first-class syntax-highlighted `CodeBlock`.

- **Framework:** Svelte 5 (runes, snippets)
- **Styling:** CSS custom properties (`--sv-*`), light + dark via
  `prefers-color-scheme` and a `[data-theme]` override
- **Type:** Inter (UI) + Iosevka (code), self-hosted and subset

## Install

Not published to npm. Consume from source:

```bash
pnpm add github:Raudbjorn/design-system
```

## Usage

Import the stylesheet once (it carries the tokens, fonts, and theme), then use
components:

```svelte
<script>
  import '@svnbjrn/design/styles.css';
  import { Button, Card, CodeBlock, StatCard, Stack } from '@svnbjrn/design';
</script>

<Stack gap={4}>
  <Button variant="primary">Ship it</Button>
  <StatCard value="128" label="Deploys" tone="accent-2" />
  <CodeBlock code={`const x = 1;`} filename="demo.ts" />
</Stack>
```

### Theming

The library is dark by default. To force a theme, set `data-theme` on a root
element:

```html
<html data-theme="light"> … </html>
```

Everything is a token — override any `--sv-*` custom property to re-skin.
Token declarations live in cascade layers ordered
`sv.base < sv.theme < sv.world < sv.user`; your own **unlayered** overrides
beat all of them (that keeps existing consumers working). To override tokens
that a runtime world theme should still be able to beat, write into
`@layer sv.base`; to beat world themes, use `@layer sv.user` or stay
unlayered.

### Theming as data (programmatic overrides)

For quick programmatic re-skins — hand-written presets or palettes extracted
from source material — build the override as data and let the library gate it:

```ts
import { applyTheme, defineTheme } from '@svnbjrn/design';

const result = defineTheme(
  { bg: '#16120c', text: '#e0d3bd', accent: '#ff9d45' },
  { base: 'dark' } // the palette it will layer over
);

if (result.ok) {
  const dispose = applyTheme(result.theme); // reversible; scoped via { selector }
} else {
  // Errors as values: unknown tokens, non-hex colors (CSS-injection guard),
  // and WCAG failures (AA 4.5:1 text, 3:1 UI — the same gates the built-in
  // palettes pass). Drop the named tokens and retry to clamp to the base.
  console.warn(result.issues);
}
```

`defineTheme` also takes an ordered array of layers — later layers win per
token, giving the strict `base → world → activity → user-override` precedence
— and `swapTheme` applies a theme through the View Transitions API when
available (instant fallback otherwise), resolving to the next disposer.

### World theming (runtime theme packages)

Themes are also **data**: a world-theme package is a JSON manifest plus
sparse DTCG token overrides (see `docs/theme-packages.md`). The runtime
engine validates every value against a strict grammar, contrast-gates the
result against WCAG AA on the effective palette, and applies it in
`@layer sv.world`:

```ts
import { parseWorldTheme, switchWorldTheme, themeBootScript } from '@svnbjrn/design/theme';

const parsed = parseWorldTheme(packageJson); // Result<WorldTheme, ThemeIssue[]>
if (parsed.ok) await switchWorldTheme(parsed.value); // View Transitions when available
```

- Scoped previews: `applyWorldTheme(theme, { scope: element })` themes a
  subtree via `data-sv-world`; multiple previews coexist.
- FOUC: paste `themeBootScript` into an inline `<script>` in `app.html`
  **before** stylesheet links — it restores the persisted mode and the
  validated, localStorage-cached world CSS pre-paint. For SSR-known themes
  render `worldThemeToCss(theme)` into `<svelte:head>` instead.
- Svelte wrapper: `createWorldTheme()` from `@svnbjrn/design/theme/svelte`.

### Generating themes from content

`@svnbjrn/design/generate` turns extracted seed colors (e.g. K-Means
dominants from uploaded art) into a complete package whose every pairing
meets WCAG AA **by construction** — contrast targets are inputs to the
solver, not an audit afterward:

```bash
pnpm generate -- --seeds "#c9a227,#b5473a" --name grimdark-hive --hints grimdark
```

The same API runs in the browser (see the Storybook **Theme Lab** story).

### Qt / QSS

The token build also emits per-theme Qt Style Sheets and flat resolved token
maps for non-web consumers: `@svnbjrn/design/qss/dark.qss` (apply via
`QApplication.setStyleSheet`) and `@svnbjrn/design/tokens/dark.tokens.json`
(css+qt values plus precomputed hover/pressed states). See
`docs/bones-integration.md`.

### Vernacular (world-flavored UI strings)

`@svnbjrn/design/vernacular` ingests an **untrusted** per-world string catalog
(machine/LLM-generated), parses it like hostile input (NFC, rejects control /
bidirectional-override / invisible-format characters, length-caps per slot),
and resolves it into component props with a world → English → key fallback and
a plain-language toggle. Producer/CI helpers: `checkTerminology` (coverage /
drift), `pseudoLocalize`, and `vernacularToJson({ escape: 'html' })` for Qt /
non-Svelte sinks. A single world bundle may carry both `tokens` and `strings`;
each parser reads its own half.

### Verified non-goals

From the 2026 world-theming research pass:

- **APCA / WCAG 3 contrast** — APCA was pulled from the WCAG 3 draft (2023) and
  is still not the standard as of April 2026. The gate stays **WCAG 2 AA**; no
  APCA gate is added.
- **View Transitions API** — ~89% global support; the existing `swapTheme` /
  `switchWorldTheme` transition is used as-is, no fallback shim needed.
- **OKLCH gamut mapping** uses CSS Color 4 **MINDE** (`gamutMapOklch`), matching
  what browsers paint for out-of-gamut extracted seeds.

## Components

**Atoms:** Text, Heading, Button, Link, Badge, Icon, Kbd, Avatar
**Layout:** Stack
**Molecules:** Card, CodeBlock, NavBar, StatCard

`CodeBlock` renders **pre-tokenized** highlight HTML (from a build-time
highlighter such as Shiki, with token classes mapping to `--sv-syn-*`); it
ships no client-side highlighter. Copy-to-clipboard always copies the raw
`code`. `showLineNumbers` renders a line-number gutter, numbered from `code`.

## Develop

```bash
pnpm install
pnpm dev          # standalone Vite preview page (all components, dark/light)
pnpm test         # Vitest + @testing-library/svelte (unit, jsdom)
pnpm test:visual  # Storybook visual tests (Chromium screenshots, Argos)
pnpm check        # svelte-check (strict)
pnpm build        # regenerate tokens + fonts, then svelte-package -> dist/
```

Visual testing is documented in [docs/visual-testing.md](docs/visual-testing.md):
every story is screenshotted in both themes and diffed on each PR via
[Argos](https://app.argos-ci.com/argos-ci-2/design-system).

Design tokens are generated from a single DTCG source
(`src/lib/tokens/*.tokens.json` + the `themes.ts` registry) via
`pnpm run tokens` — outputs (`colors.css`, `scale.css`, `palette.ts`,
`resolved/*.tokens.json`, `qss/*.qss`) are committed and drift-guarded by
tests. Adding a built-in theme is one token file plus one registry entry.
Fonts are subset from `assets/fonts-src/` via `pnpm run fonts`.

## License

Source code: **MIT** (see `LICENSE`).
Bundled fonts (Inter, Iosevka): **SIL OFL 1.1** (see `THIRD_PARTY_NOTICES.md`).
