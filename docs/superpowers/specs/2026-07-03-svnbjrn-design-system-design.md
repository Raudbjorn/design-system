# svnbjrn-design — Design System Spec

| | |
|---|---|
| Date | 2026-07-03 |
| Owner | Sveinbjörn Geirsson (svnbjrn) |
| Status | Approved design → pending spec review |
| Package | `@svnbjrn/design` (working name) |
| Location | `./svnbjrn-ds/` (new git repo; scratch assets remain untracked siblings) |

## 0 · Purpose

A personal, dark-first **developer** design system for Sveinbjörn Geirsson: real,
buildable Svelte 5 components + design tokens + self-hosted fonts. Consumable in
his own projects (SvelteKit primary) and structured so a later `/design-sync`
(package shape) can consume it without rework.

The aesthetic is restrained and terminal-native — one primary accent, one
secondary accent, a near-black neutral ramp — with a first-class syntax-highlighted
`CodeBlock` as the signature component.

Non-goals (v1): forms, modals, tables, toasts, animation system, Storybook,
multi-brand theming. Deferred until a concrete need appears.

## 1 · Identity & principles

1. **Dark-first, light-mirror.** Design for dark; provide a faithful light theme
   via `prefers-color-scheme` + a `[data-theme]` override that always wins.
2. **Restraint is the system.** Two accents (teal + coral) and a neutral ramp.
   Reaching for a fifth hue is off-system.
3. **Developer-native.** Iosevka for code/data/numerics is a feature, not a
   fallback. `CodeBlock` is a core component, not a demo.
4. **Tokens are the contract.** Everything is a CSS custom property (`--sv-*`).
   Components never hardcode a hex value.
5. **Ship what builds.** The package's `dist/` is the source of truth; the layout
   matches the `/design-sync` package shape so future syncing is deterministic.

## 2 · Design tokens

All tokens are CSS custom properties under the `--sv-` namespace, defined for dark
(`:root`, and `prefers-color-scheme: dark`) and light (`[data-theme="light"]` /
`prefers-color-scheme: light`). Component CSS references only tokens.

### 2.1 Accent

| Token | Value | Role |
|---|---|---|
| `--sv-accent` | `#4ec9b0` | Primary — links, focus ring, interactive, key figures |
| `--sv-accent-2` | `#e06c75` | Secondary (coral) — emphasis, second data series, one callout |
| `--sv-accent-rust` | `#ce9178` | Warm variant (shared with syntax string color) |

Hover/active derivations are computed by `color-mix(in oklab, …)` off the base so
there is a single source per accent.

### 2.2 Neutral ramp (dark values; light theme mirrors)

| Token | Dark | Role |
|---|---|---|
| `--sv-bg` | `#191919` | App background (ink) |
| `--sv-surface-1` | `#1e1e1e` | Cards, panels |
| `--sv-surface-2` | `#252526` | Raised / nested surfaces |
| `--sv-surface-3` | `#2d2d2d` | Code background, insets |
| `--sv-border` | `#3c3c3c` | Hairlines, dividers, component borders |
| `--sv-text` | `#d4d4d4` | Body text |
| `--sv-text-strong` | `#f5f5f5` | Headings, emphasis |
| `--sv-text-muted` | `#9a9a9a` | Captions, metadata |
| `--sv-text-faint` | `#6a6a6a` | Disabled, placeholder |

Light theme mirror (informative; finalized in implementation):
`--sv-bg #ffffff`, `--sv-surface-1 #f5f5f5`, `--sv-surface-3 #ececec`,
`--sv-border #d4d4d4`, `--sv-text #333333`, `--sv-text-strong #191919`,
`--sv-text-muted #6a6a6a`.

### 2.3 Status

| Token | Value | Meaning |
|---|---|---|
| `--sv-success` | `#0c9138` | Passing, available, approved |
| `--sv-error` | `#f44430` | Failing, blocked, alert |
| `--sv-warning` | `#ffa500` | Caution, pending |

### 2.4 Syntax (VS Code Dark+ derived) — first-class

| Token | Value | Scope |
|---|---|---|
| `--sv-syn-keyword` | `#569cd6` | keywords, control flow |
| `--sv-syn-string` | `#ce9178` | strings |
| `--sv-syn-var` | `#9cdcfe` | identifiers, variables |
| `--sv-syn-func` | `#dcdcaa` | function names |
| `--sv-syn-comment` | `#6a9955` | comments |
| `--sv-syn-number` | `#b5cea8` | numeric/boolean literals |

### 2.5 Scale tokens

- **Spacing:** `--sv-space-{0,1,2,3,4,6,8,12}` on a 4px base (`0.25rem` steps).
- **Radius:** `--sv-radius-{sm,md,lg}` = `4px / 6px / 10px`.
- **Type scale:** `--sv-fs-{xs,sm,base,lg,xl,2xl,3xl}` on a ~1.2 modular scale,
  base `1rem`. `--sv-lh-{tight,normal,relaxed}`.
- **Shadow:** `--sv-shadow-{sm,md}` (subtle; dark UIs lean on borders over shadow).
- **Focus:** `--sv-focus-ring` = `0 0 0 2px color-mix(in oklab, var(--sv-accent) 60%, transparent)`.

## 3 · Typography

- **Inter** — UI and prose. Ship `InterVariable.woff2` + `InterVariable-Italic.woff2`
  (already present in `../inter/`). `font-feature-settings` for `cv05`/`ss03`
  decided in implementation.
- **Iosevka Nerd Font** — code, data, tabular numerics. The source `.ttf` files are
  ~13 MB each; implementation **converts to woff2 and subsets** (Latin + digits +
  needed Nerd-Font glyph ranges) to keep the package small. Target: one regular +
  one bold woff2, ideally < 400 KB total.
- `@font-face` declarations live in `tokens/fonts.css`, imported by the token entry.
- Families exposed as `--sv-font-sans` and `--sv-font-mono`.

## 4 · Components (v1)

Each component: single responsibility, props-driven, ARIA-correct, keyboard-correct,
styled only via tokens in a scoped `<style>` block, no hardcoded colors.

### Atoms
- **Button** — variants `primary | secondary | ghost | danger`; sizes `sm | md | lg`;
  `disabled`, `loading`; renders `<button>` or `<a>` via `href`.
- **Icon** — Nerd-Font glyph wrapper; props `name`/`glyph`, `size`, `label`
  (a11y: decorative vs. labeled).
- **Badge** — status pill; `tone = neutral | success | error | warning | accent`.
- **Text** / **Heading** — typographic primitives binding the type ramp
  (`as`, `size`, `tone`, `weight`).
- **Link** — accent-colored, focus-visible ring, external-link affordance.
- **Kbd** — keyboard key rendering in mono.
- **Avatar** — image or initials fallback; `size`, `alt` required.

### Molecules
- **Card** — surface container; `padding`, `elevated`, optional header/footer snippets.
- **CodeBlock** — *signature component.* Syntax-highlighted (build-time or
  Shiki/highlight at runtime — decided in plan), line numbers optional, filename
  header optional, copy-to-clipboard, uses `--sv-syn-*` + `--sv-surface-3`.
- **NavBar** — top navigation; brand slot, links, responsive collapse.
- **StatCard** — labeled figure (key number in accent, caption muted); for
  dashboards/portfolio.

### API conventions
- Svelte 5 runes (`$props`, `$state`, `$derived`, `$bindable`).
- `interface Props` per component; named exports from a barrel `index.ts`.
- Snippets over slots; ARIA roles mandatory; keyboard `Enter`/`Space`/`Escape`
  where interactive.

## 5 · Structure & build

```
svnbjrn-ds/
  package.json            # @svnbjrn/design; svelte, vite, svelte-package
  vite.config.ts          # library mode
  svelte.config.js
  tsconfig.json
  .gitignore              # node_modules, dist (if not committed); scratch files are outside this repo
  src/lib/
    tokens/
      tokens.css          # --sv-* custom props (dark + light)
      fonts.css           # @font-face (Inter + Iosevka woff2)
      index.css           # imports tokens.css + fonts.css  (styles.css analog)
    fonts/                # subset woff2 files
    components/
      atoms/*.svelte
      molecules/*.svelte
    index.ts              # barrel: re-export all components + types
  dist/                   # built output (svelte-package)
  docs/superpowers/specs/ # this spec
```

- **Build:** `svelte-package` for the distributable component library; Vite for a
  local dev/preview harness. `tsc`/`svelte-check` for types.
- **Tokens reachable from one entry** (`index.css`) via `@import` — mirrors the
  `/design-sync` rule that rendered designs receive only the stylesheet's import
  closure.
- **No Storybook in v1.** A minimal Vite dev page (`/dev`) renders each component
  for eyeballing.

## 6 · `/design-sync` alignment (future, optional)

Not built now, but the layout is chosen so a future sync is low-friction:
`dist/` is the compiled source of truth; tokens are reachable from one stylesheet;
each component is isolated with a clear `Props` interface. If syncing is ever
pursued, it runs the package-shape converter against this `dist/` — no restructure.

## 7 · Testing & quality

- **Unit/render:** Vitest + `@testing-library/svelte` per component
  (`Component.test.ts`), covering variants, a11y roles, keyboard, disabled/loading.
- **Type safety:** `svelte-check` clean; strict TS.
- **Lint/format:** project-standard (Prettier + eslint-svelte); `svelte-autofixer`
  before commit.
- **Visual sanity:** the `/dev` page renders all components in dark + light.

## 8 · Open items (resolve in planning, not blocking)

1. **Iosevka subsetting** — exact glyph ranges + tool (`fonttools`/`glyphhanger`);
   confirm the < 400 KB target is achievable with needed Nerd-Font glyphs.
2. **Syntax highlighting engine** for `CodeBlock` — build-time (Shiki, richer,
   heavier) vs. lightweight runtime highlighter. Default lean: prebuilt tokens.
3. **Light-theme values** — the §2.2 mirror is provisional; finalize contrast (WCAG AA).
4. **Package name** — `@svnbjrn/design` working name; confirm before publish.
