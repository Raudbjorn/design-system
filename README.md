# @svnbjrn/design

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

## Components

**Atoms:** Text, Heading, Button, Link, Badge, Icon, Kbd, Avatar
**Layout:** Stack
**Molecules:** Card, CodeBlock, NavBar, StatCard

`CodeBlock` renders **pre-tokenized** highlight HTML (from a build-time
highlighter such as Shiki, with token classes mapping to `--sv-syn-*`); it
ships no client-side highlighter. Copy-to-clipboard always copies the raw
`code`.

## Develop

```bash
pnpm install
pnpm dev        # standalone Vite preview page (all components, dark/light)
pnpm test       # Vitest + @testing-library/svelte
pnpm check      # svelte-check (strict)
pnpm build      # regenerate tokens + fonts, then svelte-package -> dist/
```

Design tokens are generated from a single source (`src/lib/tokens/palette.ts`)
via `pnpm run tokens`; fonts are subset from `assets/fonts-src/` via
`pnpm run fonts`.

## License

Source code: **MIT** (see `LICENSE`).
Bundled fonts (Inter, Iosevka): **SIL OFL 1.1** (see `THIRD_PARTY_NOTICES.md`).
