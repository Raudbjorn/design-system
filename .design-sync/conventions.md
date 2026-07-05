# @svnbjrn/design — build conventions

Dark-first Svelte 5 design system consumed here through React wrappers: every
component on `window.SvnbjrnDesign` is the library's real compiled code. One
primary accent (teal), one secondary (coral), near-black neutrals, Inter for
UI, Iosevka for code.

## Wrapping and theme

Wrap every app root in `<ThemeRoot>`: it sets the library's theming contract
(`data-theme` on an ancestor) and paints the token background/ink/font.
Without it, components render on the host page's background and the theme
follows the viewer's OS preference instead of your design's intent.

```jsx
<ThemeRoot theme="dark">   {/* "dark" (default, the system's home turf) or "light" (pale paper) */}
  …your design…
</ThemeRoot>
```

## Custom themes — themes are data

Beyond ThemeRoot's dark/light, the theme API ships on the same global:
`defineTheme(overrides)` validates a partial palette (keys are the token
names from the table below minus the `--sv-` prefix, e.g. `accent`, `bg`,
`surface-1`; values 6-digit hex only) against the WCAG contrast gates and returns
`{ok: true, theme}` or `{ok: false, issues}` — never unchecked CSS. It also
takes an ordered array of override layers (later wins: base → world →
activity → user-override). Render an accepted theme with
`themeCss(theme, '.scope')` in a `<style>` tag, or `applyTheme(theme)`
document-wide (returns a disposer; call client-side). `swapTheme` is
`applyTheme` with a View Transitions crossfade. `dark`/`light` export the
built-in palettes as data; `contrastGates`/`contrastRatio` expose the checker.

```jsx
const world = defineTheme({ accent: '#ff9d45', 'accent-2': '#d96c5f' }); // ok over the dark base
{world.ok && <style>{themeCss(world.theme, '.ember')}</style>}
<div className="ember">…this subtree wears the world palette…</div>
```

## Styling idiom — tokens and props, never CSS classes

There is **no utility-class vocabulary**. Components style themselves via
their props (`variant`, `tone`, `size`, `padding`, `elevated`). For your own
layout glue use inline styles with the `--sv-*` tokens, and prefer `Stack`
(the only layout primitive — `gap` takes scale *steps*, not pixels).

| Family | Real names |
|---|---|
| Background/surfaces | `--sv-bg`, `--sv-surface-1`, `--sv-surface-2`, `--sv-surface-3`, `--sv-border` |
| Ink | `--sv-text`, `--sv-text-strong`, `--sv-text-muted`, `--sv-text-faint` |
| Accent & semantic | `--sv-accent` (teal), `--sv-accent-2` (coral, ≤1 emphasis/view), `--sv-accent-rust`, `--sv-success`, `--sv-error`, `--sv-warning` |
| Space (Stack gap steps) | `--sv-space-0/1/2/3/4/6/8/12` |
| Radius / shadow | `--sv-radius-sm/md/lg`, `--sv-shadow-sm/md` |
| Type | `--sv-font-sans`, `--sv-font-mono`, `--sv-fs-xs/sm/base/lg/xl/2xl/3xl`, `--sv-lh-tight/normal/relaxed`, `--sv-font-weight-normal/medium/semibold/bold` |
| Z / breakpoints | `--sv-z-base/elevated/sticky/dropdown/overlay`, `--sv-bp-sm/md/lg` |
| Syntax (CodeBlock) | `--sv-syn-keyword/string/var/func/comment/number` |

Gotchas that matter:
- **Event callbacks use Svelte's lowercase names**: `onclick`, not `onClick`.
- `children`, and Card's `header`/`footer`, NavBar's `brand`, take normal React nodes.
- `CodeBlock`: pass raw `code` (always the copy source); optional `html` is
  pre-tokenized markup whose `<span class="tok-keyword|tok-string|tok-var|tok-func|tok-comment|tok-number">`
  classes map to the `--sv-syn-*` colors. `html` must preserve `code`'s line
  count or the `showLineNumbers` gutter drifts. No client-side highlighter exists.
- `Icon` is glyph-as-text (Nerd-Font PUA range U+F000–F2FF via the bundled
  Iosevka); pass the character as `glyph`, add `label` unless decorative.
- **Vernacular labels**: NavBar (`navLabel`, `menuLabel`) and CodeBlock
  (`copyLabel`, `copiedLabel`, `copyAriaLabel`) take string overrides for
  world-flavored chrome; accessible names track the visible labels.

## Where the truth lives

Read before styling: `styles.css` (imports `tokens/index.css` →
`tokens/colors.css` + `tokens/scale.css` + `tokens/fonts.css`, then
`_ds_bundle.css` — the compiled component styles). Per-component API:
`<Name>.d.ts`; usage: `<Name>.prompt.md`.

## Idiomatic example

```jsx
<ThemeRoot theme="dark">
  <NavBar brand="svnbjrn">
    <Link href="#docs">docs</Link>
    <Badge tone="accent">v0.0.0</Badge>
  </NavBar>
  <Stack gap={4}>
    <Stack direction="row" gap={4} wrap>
      <StatCard value="99.98%" label="uptime, 30 days" />
      <StatCard value="3" label="incidents open" tone="accent-2" />
    </Stack>
    <Card header={<Heading level={4}>nginx → tailscale</Heading>}>
      <Text>Binds the Tailscale IP after <Text as="span" mono size="sm">network-online.target</Text>.</Text>
    </Card>
    <Button variant="primary" onclick={() => {}}>Deploy</Button>
  </Stack>
</ThemeRoot>
```
