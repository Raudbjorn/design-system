# Astro integration guide

How `@svnbjrn/design` fits an [Astro](https://astro.build) project: one
integration for the token CSS, the pre-paint theme boot script and build-time
world themes, plus native `.astro` ports of every component that does not need
a client runtime.

## Install

```bash
pnpm add @svnbjrn/design
pnpm astro add svelte     # the Svelte components render through @astrojs/svelte
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import svDesign from '@svnbjrn/design/astro';

export default defineConfig({
  integrations: [svDesign({ mode: 'dark' })]
});
```

That single entry:

- imports `@svnbjrn/design/styles.css` into every page (tokens, cascade layers,
  the self-hosted subset fonts) as a render-blocking `<link>`;
- puts the pre-paint boot script inline in `<head>` (Astro places it after the
  injected stylesheets — still during head parsing, so it runs before the first
  paint either way), so a returning visitor's stored theme paints on the first
  frame instead of flashing;
- adds `@astrojs/svelte` if the project has not, and leaves it alone if it has.

| Option | Default | Effect |
| --- | --- | --- |
| `styles` | `true` | Inject `@svnbjrn/design/styles.css`. |
| `boot` | `true` | Inject the pre-paint boot script. |
| `mode` | *(unset)* | `'dark'` / `'light'` seeds `data-theme` for visitors with no stored preference; `'system'` and unset both defer to `prefers-color-scheme`. A stored choice always wins — the boot script runs after the seed. |
| `world` | — | A world theme package to bake into the build (below). |
| `worldOptions` | — | Parse policy for `world`: `lockedTokens`, `onContrastFailure`, `unknownTokens`. |
| `svelte` | `true` | Add `@astrojs/svelte` when absent. Set `false` if you only use the `.astro` components. |

Without the integration nothing is lost, only automated — import the stylesheet
in a layout and render `themeBootScript` yourself:

```astro
---
import '@svnbjrn/design/styles.css';
import { themeBootScript } from '@svnbjrn/design/theme';
---
<head>
  <script is:inline set:html={themeBootScript} />
</head>
```

## Which components to import from where

Astro renders Svelte components to static HTML server-side, so *every* component
works out of the box — a `client:` directive is only needed for the ones that do
something after load. But a component with no state and no handlers has no
reason to involve the Svelte runtime at all, and those have native ports:

```astro
---
import { Card, Stack, Badge, Heading } from '@svnbjrn/design/astro/components';
import { Tabs } from '@svnbjrn/design';   // interactive → Svelte
---
<Stack gap={6}>
  <Heading level={2}>Nodes</Heading>
  <Card padding="lg">
    <Badge slot="header" tone="accent">live</Badge>
    <Tabs client:load tabs={tabs} />
  </Card>
</Stack>
```

**Ported to `.astro`** (17): `Alert`, `Avatar`, `Badge`, `Breadcrumb`, `Button`,
`Card`, `Heading`, `Icon`, `Kbd`, `Link`, `Progress`, `Spinner`, `Stack`,
`StatCard`, `Table`, `Text`, `Timeline`.

**Svelte-only** (11) — import from `@svnbjrn/design` and add a `client:`
directive: `Checkbox`, `CodeBlock`, `Input`, `Modal`, `NavBar`, `Radio`,
`Select`, `Sheet`, `Switch`, `Tabs`, `Tooltip`.

Deep imports work too, if you would rather not pull the barrel:
`import Card from '@svnbjrn/design/astro/components/Card.astro'`.

### Snippets become slots

| Svelte | Astro |
| --- | --- |
| `children` | `<slot />` — the default slot |
| `{#snippet header()}…{/snippet}` | `<div slot="header">…</div>` |
| `{#if header}` inside the component | `Astro.slots.has('header')` |

### Where the ports differ

Two props do not cross the boundary, and both are declared in
`src/lib/astro/components/unsupported.ts` rather than quietly dropped — the
parity test reads that file, so an undocumented omission fails the build.

- **`Button.onclick`.** An `.astro` component has no client runtime to hand a
  function to. `<Button href>` and `<Button type="submit">` — the two uses that
  need no JS — work exactly as before. Anything else is the Svelte `Button`
  with a `client:` directive.
- **`Table.cell` and `Table.rowKey`.** Astro slots take no parameters, so a
  per-cell render callback cannot cross; cells render their raw value. `rowKey`
  exists to key Svelte's `{#each}` across updates, and static output has none.

Everything else — every prop, every default, every element, every style
declaration — is identical, and stays identical: `parity.test.ts` renders each
component through both compilers and compares the parsed result, plus the two
`<style>` blocks byte-for-byte.

## World themes at build time

A seed-generated world theme normally lands after hydration, via
`applyWorldTheme`. In a statically-generated site that means the first paint is
unthemed. Hand the package to the integration instead and it is parsed,
contrast-gated and emitted into the build:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import svDesign from '@svnbjrn/design/astro';
import world from './src/themes/grimdark.json' with { type: 'json' };

export default defineConfig({
  integrations: [
    svDesign({
      world,
      worldOptions: { lockedTokens: ['success', 'error', 'warning'] }
    })
  ]
});
```

The CSS is served through a Vite virtual module, so it is hashed and minified
like any other stylesheet and hot-reloads in `astro dev`. It lands in
`@layer sv.world`, which beats `sv.theme` regardless of load order.

**This throws.** The rest of the library returns errors as values; a config hook
has no caller to return a `Result` to, and the failure it guards — a production
build shipping a palette that fails WCAG AA — is worse than a failed build. A
rejected package fails with its `ThemeIssue[]` formatted into the message.
Non-fatal findings (a contrast-failing token reverted to its built-in value
under the default `'revert'` policy) are logged as build warnings, because they
change what ships.

The boot script is still injected: it handles *runtime* theme switching, which
the baked stylesheet does not.

## Deliberate divergences

- **Astro scopes with `data-astro-cid-*`, Svelte with a `svelte-<hash>` class.**
  Both hang off the same `[data-sv='…']` selectors, so the styles are textually
  identical and the mechanism is invisible in the output.
- **Slotted content is unscoped in both.** A component's styles do not reach
  markup passed into it, from either side.
- **`Stack` intercepts `style`.** The Svelte version relies on `style:`
  directives beating a spread `style` attribute; the port composes the two
  strings by hand, ours last, to preserve that precedence.
- **No cascade layer around the components' own styles.** Unchanged from the
  Svelte components — this is about `--sv-*` tokens, and the layer order is
  declared once by `styles.css`.

## Verifying a change

`pnpm test` runs the `astro` project alongside `unit`. If you touch a ported
component on either side, the parity test is what tells you whether the other
side still agrees; if you add a component that has no state and no handlers,
`barrel.test.ts` fails until it is ported, because the ported set is derived
from the source, not from a list someone maintains.

## Not covered

Vermis and Carter (their identity lives in per-component markup and SVG assets,
not just tokens — porting them means porting two more component systems), the
vernacular catalogs, Astro content collections, Astro's `<Image>` / asset
pipeline, and the React bridge.
