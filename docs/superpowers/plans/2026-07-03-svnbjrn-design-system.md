# svnbjrn-design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@svnbjrn/design` — a dark-first, developer-native Svelte 5 component library (tokens + self-hosted fonts + 13 components) that builds to a distributable `dist/`.

**Architecture:** Design tokens live as CSS custom properties (`--sv-*`) generated from a single-source `palette.ts`, plus hand-written scale tokens. Self-hosted Inter + subset Iosevka Nerd Font. Components are Svelte 5 (runes, snippets), styled only via tokens, tested with Vitest + `@testing-library/svelte`. Packaged with `svelte-package`.

**Tech Stack:** Svelte 5, Vite, `@sveltejs/package`, TypeScript (strict), Vitest, `@testing-library/svelte` v5, jsdom, fonttools (`pyftsubset`).

## Global Constraints

- **Runtime floors:** Node ≥ 24, pnpm ≥ 11 (present: node v24.13.0, pnpm 11.3.0).
- **Package manager:** pnpm only. Never npm/yarn.
- **Framework:** Svelte 5 runes only (`$props`, `$state`, `$derived`, `$bindable`). No Svelte 4 syntax, no legacy slots — snippets only.
- **Token namespace:** every custom property is `--sv-*`. Components reference tokens only — **no hardcoded hex, px font sizes, or raw colors** in component `<style>`.
- **Accent values:** dark `--sv-accent` `#4ec9b0`, `--sv-accent-2` `#e06c75`; light `--sv-accent` `#2b8a77`, `--sv-accent-2` `#c0505a`.
- **A11y:** interactive components use `:focus-visible` (never bare `:focus`); focus style is `outline: 2px solid var(--sv-accent); outline-offset: 2px`. ARIA roles mandatory; keyboard `Enter`/`Space`/`Escape` where interactive. Body text ≥ WCAG AA 4.5:1; accents/UI ≥ 3:1.
- **Fonts:** all `@font-face` use `font-display: swap`. Iosevka subset MUST preserve Nerd-Font PUA (`U+E000–U+F8FF`, `U+F0000–U+FFFFD`). Per-weight woff2 < 400 KB.
- **TS:** `strict: true`, `noUncheckedIndexedAccess: true`. Named exports; `interface Props` per component.
- **Commits:** frequent, one per task minimum. Co-Authored-By trailer:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## File Structure

```
svnbjrn-ds/
  package.json                 # @svnbjrn/design; scripts; exports map
  vite.config.ts               # dev/preview
  vitest.config.ts             # svelte + svelteTesting plugins, jsdom
  vitest-setup.ts              # jest-dom matchers
  svelte.config.js             # vitePreprocess
  tsconfig.json                # strict
  scripts/
    build-tokens.mjs           # palette.ts -> colors.css
    build-fonts.mjs            # subset Iosevka + copy Inter -> src/lib/fonts
  src/lib/
    internal/contrast.ts       # contrastRatio() (test/util)
    tokens/
      palette.ts               # single-source hex (dark + light)
      colors.css               # GENERATED
      scale.css                # space/radius/type/z/bp/shadow/mix-target rules
      fonts.css                # @font-face
      index.css                # @import fonts, colors, scale  (public "styles.css")
    fonts/                     # subset woff2 (generated)
    components/
      atoms/{Text,Heading,Button,Link,Badge,Icon,Kbd,Avatar}.svelte
      layout/Stack.svelte
      molecules/{Card,CodeBlock,NavBar,StatCard}.svelte
    index.ts                   # barrel: components + types
  src/routes/+page.svelte      # /dev preview page (Vite dev only, not packaged)
  dist/                        # svelte-package output
```

---

### Task 1: Project scaffold & test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `svelte.config.js`, `vite.config.ts`, `vitest.config.ts`, `vitest-setup.ts`
- Create: `src/lib/internal/smoke.ts`, `src/lib/internal/smoke.test.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: working `pnpm test`, `pnpm check`, `pnpm build` scripts; jsdom + `@testing-library/svelte` render environment for all later tasks.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@svnbjrn/design",
  "version": "0.0.0",
  "type": "module",
  "license": "MIT",
  "files": ["dist"],
  "svelte": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "svelte": "./dist/index.js" },
    "./styles.css": "./dist/tokens/index.css"
  },
  "scripts": {
    "dev": "vite dev",
    "build": "pnpm run tokens && pnpm run fonts && svelte-package && publint",
    "tokens": "node scripts/build-tokens.mjs",
    "fonts": "node scripts/build-fonts.mjs",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": { "svelte": "^5.0.0" },
  "devDependencies": {
    "@sveltejs/package": "^2.3.0",
    "@sveltejs/vite-plugin-svelte": "^5.0.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/svelte": "^5.2.0",
    "jsdom": "^25.0.0",
    "publint": "^0.2.0",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: lockfile created, no errors.

- [ ] **Step 3: Create config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "allowJs": true,
    "checkJs": true
  },
  "include": ["src/**/*.ts", "src/**/*.svelte", "vite.config.ts", "vitest.config.ts"]
}
```

`svelte.config.js`:
```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default { preprocess: vitePreprocess() };
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({ plugins: [svelte()] });
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest-setup.ts']
  }
});
```

`vitest-setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Write a smoke test**

`src/lib/internal/smoke.ts`:
```ts
export const smoke = (): string => 'ok';
```

`src/lib/internal/smoke.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { smoke } from './smoke';

describe('harness', () => {
  it('runs', () => {
    expect(smoke()).toBe('ok');
  });
});
```

- [ ] **Step 5: Run test — verify pass**

Run: `pnpm test`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold @svnbjrn/design package + vitest harness

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Palette single-source, token generator, contrast validation

**Files:**
- Create: `src/lib/internal/contrast.ts`, `src/lib/internal/contrast.test.ts`
- Create: `src/lib/tokens/palette.ts`, `src/lib/tokens/palette.test.ts`
- Create: `scripts/build-tokens.mjs`
- Generate: `src/lib/tokens/colors.css`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `contrastRatio(hexA: string, hexB: string): number`
  - `palette.ts` exports `dark: Palette`, `light: Palette` where `type Palette = Record<string, string>` keyed by token name **without** the `--sv-` prefix (e.g. `bg`, `accent`, `syn-keyword`).
  - `src/lib/tokens/colors.css` defining `--sv-*` color vars for dark (default) + light.

- [ ] **Step 1: Write the failing contrast test**

`src/lib/internal/contrast.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
  it('is 1 for identical colors', () => {
    expect(contrastRatio('#4ec9b0', '#4ec9b0')).toBeCloseTo(1, 5);
  });
  it('is order-independent', () => {
    expect(contrastRatio('#191919', '#d4d4d4')).toBeCloseTo(
      contrastRatio('#d4d4d4', '#191919'),
      5
    );
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/internal/contrast.test.ts`
Expected: FAIL — cannot find `./contrast`.

- [ ] **Step 3: Implement contrast util**

`src/lib/internal/contrast.ts`:
```ts
const channel = (c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const luminance = (hex: string): number => {
  const n = hex.replace('#', '');
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrastRatio = (a: string, b: string): number => {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
};
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/internal/contrast.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Create the palette single-source**

`src/lib/tokens/palette.ts`:
```ts
export type Palette = Record<string, string>;

// Dark theme (default). Values hand-verified for WCAG AA where noted.
export const dark: Palette = {
  bg: '#191919',
  'surface-1': '#1e1e1e',
  'surface-2': '#252526',
  'surface-3': '#2d2d2d',
  border: '#3c3c3c',
  text: '#d4d4d4',
  'text-strong': '#f5f5f5',
  'text-muted': '#9a9a9a',
  'text-faint': '#818181', // AA (>=4.5:1) on #191919; review's #767676 only cleared black
  accent: '#4ec9b0',
  'accent-2': '#e06c75',
  'accent-rust': '#ce9178',
  'mix-target': '#ffffff', // hover lightens in dark
  success: '#0c9138',
  error: '#f44430',
  warning: '#ffa500',
  'syn-keyword': '#569cd6',
  'syn-string': '#ce9178',
  'syn-var': '#9cdcfe',
  'syn-func': '#dcdcaa',
  'syn-comment': '#6a9955',
  'syn-number': '#b5cea8'
};

// Light theme mirror. Accents darkened to clear AA on white.
export const light: Palette = {
  bg: '#ffffff',
  'surface-1': '#f5f5f5',
  'surface-2': '#ececec',
  'surface-3': '#e4e4e4',
  border: '#d4d4d4',
  text: '#333333',
  'text-strong': '#191919',
  'text-muted': '#6a6a6a',
  'text-faint': '#767676', // AA on #ffffff
  accent: '#2b8a77',
  'accent-2': '#c0505a',
  'accent-rust': '#b26a45',
  'mix-target': '#000000', // hover darkens in light
  success: '#0c9138',
  error: '#d13b2a',
  warning: '#b26a00',
  'syn-keyword': '#0000ff',
  'syn-string': '#a31515',
  'syn-var': '#001080',
  'syn-func': '#795e26',
  'syn-comment': '#008000',
  'syn-number': '#098658'
};
```

- [ ] **Step 6: Write the failing palette-contrast test**

`src/lib/tokens/palette.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../internal/contrast';
import { dark, light } from './palette';

describe('palette accessibility', () => {
  const bodyTokens = ['text', 'text-strong', 'text-muted', 'text-faint'] as const;

  it('dark body text clears AA on bg', () => {
    for (const t of bodyTokens) {
      expect(contrastRatio(dark[t]!, dark.bg!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('light body text clears AA on bg', () => {
    for (const t of bodyTokens) {
      expect(contrastRatio(light[t]!, light.bg!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('accents clear the 3:1 UI threshold on their bg', () => {
    for (const t of ['accent', 'accent-2'] as const) {
      expect(contrastRatio(dark[t]!, dark.bg!)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(light[t]!, light.bg!)).toBeGreaterThanOrEqual(3);
    }
  });

  it('dark and light define the same token keys', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });
});
```

- [ ] **Step 7: Run — verify pass**

Run: `pnpm test src/lib/tokens/palette.test.ts`
Expected: 4 passed. (If any assertion fails, the hex is wrong — fix the value, not the threshold.)

- [ ] **Step 8: Write the token generator**

`scripts/build-tokens.mjs`:
```js
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { dark, light } from '../src/lib/tokens/palette.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '../src/lib/tokens/colors.css');

const block = (sel, p) =>
  `${sel} {\n` +
  Object.entries(p)
    .map(([k, v]) => `  --sv-${k}: ${v};`)
    .join('\n') +
  '\n}\n';

const css =
  `/* GENERATED by scripts/build-tokens.mjs — do not edit by hand. */\n` +
  block(':root', dark) +
  `@media (prefers-color-scheme: light) {\n` +
  block('  :root:not([data-theme="dark"])', light) +
  `}\n` +
  block('[data-theme="light"]', light) +
  block('[data-theme="dark"]', dark);

writeFileSync(out, css);
console.log('wrote', out);
```

Note: Node 24 imports `.ts` via its native type-stripping. If the runner errors on the `.ts` import, run `node --experimental-strip-types scripts/build-tokens.mjs`.

- [ ] **Step 9: Generate and verify**

Run: `pnpm run tokens`
Expected: `wrote .../colors.css`.
Run: `grep -c -- '--sv-accent:' src/lib/tokens/colors.css`
Expected: `3` (root, light, dark blocks).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(tokens): palette single-source, generator, contrast validation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Fonts — subset Iosevka, copy Inter, @font-face

**Files:**
- Create: `scripts/build-fonts.mjs`
- Create: `src/lib/tokens/fonts.css`
- Create: `scripts/fonts.test.mjs` → run via `src/lib/tokens/fonts.test.ts`
- Generate: `src/lib/fonts/*.woff2`

**Interfaces:**
- Consumes: source fonts at `../inter/InterVariable*.woff2` and `../IosevkaNerdFont-{Regular,Bold}.ttf` (relative to `svnbjrn-ds/`).
- Produces: `src/lib/fonts/{InterVariable,InterVariable-Italic,Iosevka-Regular,Iosevka-Bold}.woff2` and `fonts.css` declaring families `Inter` and `Iosevka` with `font-display: swap`.

- [ ] **Step 1: Write the font build script**

`scripts/build-fonts.mjs`:
```js
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(root, 'src/lib/fonts');
mkdirSync(outDir, { recursive: true });

// Inter: already woff2 — copy verbatim.
for (const f of ['InterVariable.woff2', 'InterVariable-Italic.woff2']) {
  copyFileSync(join(root, '../inter', f), join(outDir, f));
}

// Iosevka: subset TTF -> woff2. Keep Latin-1 + punctuation + digits + Nerd-Font PUA.
const unicodes = [
  'U+0000-00FF', // Latin-1
  'U+2000-206F', // general punctuation
  'U+2190-21FF', // arrows (common in code)
  'U+2500-259F', // box drawing (Nerd terminal)
  'U+E000-E00A,U+E0A0-E0A2,U+E0B0-E0B3', // powerline (scoped PUA)
  'U+F000-F2FF' // scoped Nerd-Font icon subset
].join(',');

const subset = (src, dest) =>
  execFileSync('pyftsubset', [
    join(root, src),
    `--unicodes=${unicodes}`,
    '--layout-features=*',
    '--no-hinting',
    '--desubroutinize',
    '--flavor=woff2',
    `--output-file=${dest}`
  ]);

subset('../IosevkaNerdFont-Regular.ttf', join(outDir, 'Iosevka-Regular.woff2'));
subset('../IosevkaNerdFont-Bold.ttf', join(outDir, 'Iosevka-Bold.woff2'));

for (const f of ['Iosevka-Regular.woff2', 'Iosevka-Bold.woff2']) {
  if (!existsSync(join(outDir, f))) throw new Error(`missing ${f}`);
}
console.log('fonts built');
```

- [ ] **Step 2: Run the font build**

Run: `pnpm run fonts`
Expected: `fonts built`, and `src/lib/fonts/` holds 4 woff2 files.

- [ ] **Step 3: Write the failing font-budget + PUA test**

`src/lib/tokens/fonts.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const fontsDir = join(here, '../fonts');

describe('fonts', () => {
  it('Iosevka weights are under 400 KB each', () => {
    for (const f of ['Iosevka-Regular.woff2', 'Iosevka-Bold.woff2']) {
      expect(statSync(join(fontsDir, f)).size).toBeLessThan(400 * 1024);
    }
  });

  it('fonts.css uses font-display: swap for every face', () => {
    const css = readFileSync(join(here, 'fonts.css'), 'utf8');
    const faces = css.match(/@font-face/g) ?? [];
    const swaps = css.match(/font-display:\s*swap/g) ?? [];
    expect(faces.length).toBeGreaterThanOrEqual(4);
    expect(swaps.length).toBe(faces.length);
  });
});
```

- [ ] **Step 4: Run — verify fail**

Run: `pnpm test src/lib/tokens/fonts.test.ts`
Expected: FAIL — `fonts.css` missing.

- [ ] **Step 5: Write `fonts.css`**

`src/lib/tokens/fonts.css`:
```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('../fonts/InterVariable.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;
  src: url('../fonts/InterVariable-Italic.woff2') format('woff2');
}
@font-face {
  font-family: 'Iosevka';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('../fonts/Iosevka-Regular.woff2') format('woff2');
}
@font-face {
  font-family: 'Iosevka';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../fonts/Iosevka-Bold.woff2') format('woff2');
}
```

- [ ] **Step 6: Run — verify pass**

Run: `pnpm test src/lib/tokens/fonts.test.ts`
Expected: 2 passed. (If the size test fails, tighten the `unicodes` ranges in the build script — do not raise the budget.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(fonts): subset Iosevka (PUA-preserving), copy Inter, font-face

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Scale tokens + public stylesheet entry

**Files:**
- Create: `src/lib/tokens/scale.css`, `src/lib/tokens/index.css`
- Create: `src/lib/tokens/entry.test.ts`

**Interfaces:**
- Consumes: `fonts.css`, `colors.css` (Tasks 2–3).
- Produces: `src/lib/tokens/index.css` — the single public stylesheet (`@svnbjrn/design/styles.css`). Defines font-family, spacing, radius, type, z-index, breakpoint, shadow, and mix-target-adjacent scale tokens.

- [ ] **Step 1: Write `scale.css`**

`src/lib/tokens/scale.css`:
```css
:root {
  --sv-font-sans: 'Inter', system-ui, sans-serif;
  --sv-font-mono: 'Iosevka', ui-monospace, 'Courier New', monospace;

  --sv-space-0: 0;
  --sv-space-1: 0.25rem;
  --sv-space-2: 0.5rem;
  --sv-space-3: 0.75rem;
  --sv-space-4: 1rem;
  --sv-space-6: 1.5rem;
  --sv-space-8: 2rem;
  --sv-space-12: 3rem;

  --sv-radius-sm: 4px;
  --sv-radius-md: 6px;
  --sv-radius-lg: 10px;

  --sv-fs-xs: 0.75rem;
  --sv-fs-sm: 0.875rem;
  --sv-fs-base: 1rem;
  --sv-fs-lg: 1.2rem;
  --sv-fs-xl: 1.44rem;
  --sv-fs-2xl: 1.728rem;
  --sv-fs-3xl: 2.074rem;

  --sv-lh-tight: 1.2;
  --sv-lh-normal: 1.5;
  --sv-lh-relaxed: 1.7;

  --sv-z-base: 0;
  --sv-z-elevated: 10;
  --sv-z-sticky: 100;
  --sv-z-dropdown: 1000;
  --sv-z-overlay: 2000;

  /* Breakpoints — canonical reference. CSS vars cannot be used inside @media
     conditions, so component queries hardcode these px values verbatim. */
  --sv-bp-sm: 640px;
  --sv-bp-md: 768px;
  --sv-bp-lg: 1024px;

  --sv-shadow-sm: 0 1px 2px rgb(0 0 0 / 0.3);
  --sv-shadow-md: 0 4px 12px rgb(0 0 0 / 0.35);
}
```

- [ ] **Step 2: Write `index.css`**

`src/lib/tokens/index.css`:
```css
@import './fonts.css';
@import './colors.css';
@import './scale.css';
```

- [ ] **Step 3: Write the import-closure test**

`src/lib/tokens/entry.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f: string) => readFileSync(join(here, f), 'utf8');

describe('token entry', () => {
  it('index.css imports fonts, colors, and scale', () => {
    const css = read('index.css');
    expect(css).toContain("@import './fonts.css'");
    expect(css).toContain("@import './colors.css'");
    expect(css).toContain("@import './scale.css'");
  });

  it('scale defines the font-family + z + breakpoint tokens', () => {
    const css = read('scale.css');
    for (const t of ['--sv-font-mono', '--sv-z-dropdown', '--sv-bp-md', '--sv-space-4']) {
      expect(css).toContain(t);
    }
  });
});
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/tokens/entry.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(tokens): scale tokens + public styles.css entry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Text & Heading primitives

**Files:**
- Create: `src/lib/components/atoms/Text.svelte`, `src/lib/components/atoms/Heading.svelte`
- Create: `src/lib/components/atoms/Text.test.ts`, `src/lib/components/atoms/Heading.test.ts`

**Interfaces:**
- Consumes: tokens.
- Produces:
  - `Text` props: `{ size?: 'xs'|'sm'|'base'|'lg'; tone?: 'default'|'strong'|'muted'|'faint'; mono?: boolean; as?: 'p'|'span'|'div'; children: Snippet }`
  - `Heading` props: `{ level?: 1|2|3|4; children: Snippet }` — renders `<h{level}>` with matching type size.

- [ ] **Step 1: Write failing Text test**

`src/lib/components/atoms/Text.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Text from './Text.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Text', () => {
  it('renders children in a <p> by default', () => {
    render(Text, { children: kids('hello') });
    const el = screen.getByText('hello').closest('p');
    expect(el).toBeInTheDocument();
  });

  it('applies tone + size data attributes', () => {
    render(Text, { tone: 'muted', size: 'sm', children: kids('meta') });
    const el = screen.getByText('meta').closest('[data-sv="text"]');
    expect(el).toHaveAttribute('data-tone', 'muted');
    expect(el).toHaveAttribute('data-size', 'sm');
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/atoms/Text.test.ts`
Expected: FAIL — no `Text.svelte`.

- [ ] **Step 3: Implement `Text.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    size?: 'xs' | 'sm' | 'base' | 'lg';
    tone?: 'default' | 'strong' | 'muted' | 'faint';
    mono?: boolean;
    as?: 'p' | 'span' | 'div';
    children: Snippet;
  }

  let { size = 'base', tone = 'default', mono = false, as = 'p', children }: Props = $props();
</script>

<svelte:element
  this={as}
  data-sv="text"
  data-size={size}
  data-tone={tone}
  class:mono
>
  {@render children()}
</svelte:element>

<style>
  [data-sv='text'] {
    margin: 0;
    font-family: var(--sv-font-sans);
    line-height: var(--sv-lh-normal);
    color: var(--sv-text);
  }
  .mono { font-family: var(--sv-font-mono); }
  [data-size='xs'] { font-size: var(--sv-fs-xs); }
  [data-size='sm'] { font-size: var(--sv-fs-sm); }
  [data-size='base'] { font-size: var(--sv-fs-base); }
  [data-size='lg'] { font-size: var(--sv-fs-lg); }
  [data-tone='strong'] { color: var(--sv-text-strong); }
  [data-tone='muted'] { color: var(--sv-text-muted); }
  [data-tone='faint'] { color: var(--sv-text-faint); }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/atoms/Text.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Write failing Heading test**

`src/lib/components/atoms/Heading.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Heading from './Heading.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Heading', () => {
  it('renders an h2 for level 2', () => {
    render(Heading, { level: 2, children: kids('Title') });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Title');
  });
  it('defaults to h1', () => {
    render(Heading, { children: kids('Top') });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Implement `Heading.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    level?: 1 | 2 | 3 | 4;
    children: Snippet;
  }

  let { level = 1, children }: Props = $props();
  const tag = $derived(`h${level}` as const);
</script>

<svelte:element this={tag} data-sv="heading" data-level={level}>
  {@render children()}
</svelte:element>

<style>
  [data-sv='heading'] {
    margin: 0;
    font-family: var(--sv-font-sans);
    color: var(--sv-text-strong);
    line-height: var(--sv-lh-tight);
    font-weight: 650;
  }
  [data-level='1'] { font-size: var(--sv-fs-3xl); }
  [data-level='2'] { font-size: var(--sv-fs-2xl); }
  [data-level='3'] { font-size: var(--sv-fs-xl); }
  [data-level='4'] { font-size: var(--sv-fs-lg); }
</style>
```

- [ ] **Step 7: Run — verify pass**

Run: `pnpm test src/lib/components/atoms/Heading.test.ts`
Expected: 2 passed.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(atoms): Text and Heading primitives

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Button

**Files:**
- Create: `src/lib/components/atoms/Button.svelte`, `src/lib/components/atoms/Button.test.ts`

**Interfaces:**
- Consumes: tokens.
- Produces: `Button` props `{ variant?: 'primary'|'secondary'|'ghost'|'danger'; size?: 'sm'|'md'|'lg'; href?: string; type?: 'button'|'submit'; disabled?: boolean; loading?: boolean; onclick?: (e: MouseEvent) => void; children: Snippet }`. Renders `<a>` when `href` set, else `<button>`.

- [ ] **Step 1: Write failing test**

`src/lib/components/atoms/Button.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Button', () => {
  it('renders a button with the primary variant by default', () => {
    render(Button, { children: kids('Go') });
    const btn = screen.getByRole('button', { name: 'Go' });
    expect(btn).toHaveAttribute('data-variant', 'primary');
  });

  it('renders an anchor when href is set', () => {
    render(Button, { href: '/x', children: kids('Link') });
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute('href', '/x');
  });

  it('is disabled and non-clickable when disabled', async () => {
    const onclick = vi.fn();
    render(Button, { disabled: true, onclick, children: kids('No') });
    const btn = screen.getByRole('button', { name: 'No' });
    expect(btn).toBeDisabled();
    btn.click();
    expect(onclick).not.toHaveBeenCalled();
  });

  it('exposes busy state when loading', () => {
    render(Button, { loading: true, children: kids('Wait') });
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/atoms/Button.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `Button.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    href,
    type = 'button',
    disabled = false,
    loading = false,
    onclick,
    children
  }: Props = $props();
</script>

{#if href}
  <a
    {href}
    data-sv="button"
    data-variant={variant}
    data-size={size}
    aria-disabled={disabled || undefined}
    aria-busy={loading || undefined}
    {onclick}
  >
    {@render children()}
  </a>
{:else}
  <button
    {type}
    data-sv="button"
    data-variant={variant}
    data-size={size}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {onclick}
  >
    {@render children()}
  </button>
{/if}

<style>
  [data-sv='button'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sv-space-2);
    font-family: var(--sv-font-sans);
    font-weight: 550;
    border: 1px solid transparent;
    border-radius: var(--sv-radius-md);
    cursor: pointer;
    text-decoration: none;
    line-height: 1;
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }
  [data-size='sm'] { font-size: var(--sv-fs-sm); padding: var(--sv-space-1) var(--sv-space-3); }
  [data-size='md'] { font-size: var(--sv-fs-base); padding: var(--sv-space-2) var(--sv-space-4); }
  [data-size='lg'] { font-size: var(--sv-fs-lg); padding: var(--sv-space-3) var(--sv-space-6); }

  [data-variant='primary'] { background: var(--sv-accent); color: var(--sv-bg); }
  [data-variant='primary']:hover {
    background: color-mix(in oklab, var(--sv-accent), var(--sv-mix-target) 15%);
  }
  [data-variant='secondary'] { background: var(--sv-accent-2); color: var(--sv-bg); }
  [data-variant='secondary']:hover {
    background: color-mix(in oklab, var(--sv-accent-2), var(--sv-mix-target) 15%);
  }
  [data-variant='ghost'] {
    background: transparent;
    color: var(--sv-text);
    border-color: var(--sv-border);
  }
  [data-variant='ghost']:hover { background: var(--sv-surface-2); }
  [data-variant='danger'] { background: var(--sv-error); color: #fff; }
  [data-variant='danger']:hover {
    background: color-mix(in oklab, var(--sv-error), var(--sv-mix-target) 15%);
  }

  [data-sv='button']:focus-visible {
    outline: 2px solid var(--sv-accent);
    outline-offset: 2px;
  }
  button[disabled] { opacity: 0.5; cursor: not-allowed; }
  [aria-disabled='true'] { opacity: 0.5; pointer-events: none; }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/atoms/Button.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(atoms): Button (variants, sizes, anchor mode, loading)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Link

**Files:**
- Create: `src/lib/components/atoms/Link.svelte`, `src/lib/components/atoms/Link.test.ts`

**Interfaces:**
- Produces: `Link` props `{ href: string; external?: boolean; children: Snippet }`. When `external`, sets `target="_blank" rel="noopener noreferrer"` and appends an external affordance.

- [ ] **Step 1: Write failing test**

`src/lib/components/atoms/Link.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Link from './Link.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Link', () => {
  it('renders an anchor with href', () => {
    render(Link, { href: '/a', children: kids('home') });
    expect(screen.getByRole('link', { name: /home/ })).toHaveAttribute('href', '/a');
  });
  it('marks external links safely', () => {
    render(Link, { href: 'https://x.io', external: true, children: kids('out') });
    const a = screen.getByRole('link', { name: /out/ });
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/atoms/Link.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `Link.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    external?: boolean;
    children: Snippet;
  }

  let { href, external = false, children }: Props = $props();
</script>

<a
  {href}
  data-sv="link"
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener noreferrer' : undefined}
>
  {@render children()}{#if external}<span aria-hidden="true" class="ext">↗</span>{/if}
</a>

<style>
  [data-sv='link'] {
    color: var(--sv-accent);
    text-decoration: none;
    border-bottom: 1px solid transparent;
  }
  [data-sv='link']:hover {
    border-bottom-color: color-mix(in oklab, var(--sv-accent), transparent 50%);
  }
  [data-sv='link']:focus-visible {
    outline: 2px solid var(--sv-accent);
    outline-offset: 2px;
    border-radius: var(--sv-radius-sm);
  }
  .ext { margin-inline-start: 0.15em; font-size: 0.85em; }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/atoms/Link.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(atoms): Link (external-safe)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Badge

**Files:**
- Create: `src/lib/components/atoms/Badge.svelte`, `src/lib/components/atoms/Badge.test.ts`

**Interfaces:**
- Produces: `Badge` props `{ tone?: 'neutral'|'success'|'error'|'warning'|'accent'; children: Snippet }`.

- [ ] **Step 1: Write failing test**

`src/lib/components/atoms/Badge.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Badge from './Badge.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Badge', () => {
  it('defaults to neutral tone', () => {
    render(Badge, { children: kids('new') });
    expect(screen.getByText('new').closest('[data-sv="badge"]')).toHaveAttribute(
      'data-tone',
      'neutral'
    );
  });
  it('applies the requested tone', () => {
    render(Badge, { tone: 'success', children: kids('ok') });
    expect(screen.getByText('ok').closest('[data-sv="badge"]')).toHaveAttribute(
      'data-tone',
      'success'
    );
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/atoms/Badge.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `Badge.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    tone?: 'neutral' | 'success' | 'error' | 'warning' | 'accent';
    children: Snippet;
  }

  let { tone = 'neutral', children }: Props = $props();
</script>

<span data-sv="badge" data-tone={tone}>{@render children()}</span>

<style>
  [data-sv='badge'] {
    display: inline-flex;
    align-items: center;
    padding: 0.1em 0.55em;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    line-height: 1.5;
    border-radius: var(--sv-radius-sm);
    border: 1px solid var(--sv-border);
    color: var(--sv-text);
    background: var(--sv-surface-2);
  }
  [data-tone='success'] { color: var(--sv-success); border-color: var(--sv-success); }
  [data-tone='error'] { color: var(--sv-error); border-color: var(--sv-error); }
  [data-tone='warning'] { color: var(--sv-warning); border-color: var(--sv-warning); }
  [data-tone='accent'] { color: var(--sv-accent); border-color: var(--sv-accent); }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/atoms/Badge.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(atoms): Badge (status tones)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Icon

**Files:**
- Create: `src/lib/components/atoms/Icon.svelte`, `src/lib/components/atoms/Icon.test.ts`

**Interfaces:**
- Produces: `Icon` props `{ glyph: string; label?: string; size?: 'sm'|'md'|'lg' }`. Renders a mono-font span holding the Nerd-Font PUA `glyph`. With `label` → `role="img"` + `aria-label`; without → `aria-hidden="true"` (decorative).

- [ ] **Step 1: Write failing test**

`src/lib/components/atoms/Icon.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Icon from './Icon.svelte';

describe('Icon', () => {
  it('is decorative (aria-hidden) without a label', () => {
    const { container } = render(Icon, { glyph: '' });
    const el = container.querySelector('[data-sv="icon"]');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });
  it('is a labeled img with a label', () => {
    render(Icon, { glyph: '', label: 'home' });
    const el = screen.getByRole('img', { name: 'home' });
    expect(el).toHaveAttribute('data-sv', 'icon');
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/atoms/Icon.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `Icon.svelte`**

```svelte
<script lang="ts">
  interface Props {
    glyph: string;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { glyph, label, size = 'md' }: Props = $props();
</script>

<span
  data-sv="icon"
  data-size={size}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>{glyph}</span>

<style>
  [data-sv='icon'] {
    font-family: var(--sv-font-mono);
    line-height: 1;
    display: inline-block;
  }
  [data-size='sm'] { font-size: var(--sv-fs-sm); }
  [data-size='md'] { font-size: var(--sv-fs-base); }
  [data-size='lg'] { font-size: var(--sv-fs-lg); }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/atoms/Icon.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(atoms): Icon (Nerd-Font glyph wrapper, a11y-aware)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: Kbd

**Files:**
- Create: `src/lib/components/atoms/Kbd.svelte`, `src/lib/components/atoms/Kbd.test.ts`

**Interfaces:**
- Produces: `Kbd` props `{ children: Snippet }`. Renders a `<kbd>` in mono.

- [ ] **Step 1: Write failing test**

`src/lib/components/atoms/Kbd.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Kbd from './Kbd.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `${t}` }));

describe('Kbd', () => {
  it('renders a <kbd> element', () => {
    const { container } = render(Kbd, { children: kids('Esc') });
    const el = container.querySelector('kbd');
    expect(el).toHaveTextContent('Esc');
    expect(el).toHaveAttribute('data-sv', 'kbd');
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/atoms/Kbd.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `Kbd.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props { children: Snippet; }
  let { children }: Props = $props();
</script>

<kbd data-sv="kbd">{@render children()}</kbd>

<style>
  [data-sv='kbd'] {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    padding: 0.1em 0.4em;
    border: 1px solid var(--sv-border);
    border-bottom-width: 2px;
    border-radius: var(--sv-radius-sm);
    background: var(--sv-surface-3);
    color: var(--sv-text-strong);
  }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/atoms/Kbd.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(atoms): Kbd

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: Avatar

**Files:**
- Create: `src/lib/components/atoms/Avatar.svelte`, `src/lib/components/atoms/Avatar.test.ts`

**Interfaces:**
- Produces: `Avatar` props `{ src?: string; alt: string; size?: 'sm'|'md'|'lg' }`. With `src` → `<img>`; without → initials fallback derived from `alt`, `role="img"` + `aria-label={alt}`.

- [ ] **Step 1: Write failing test**

`src/lib/components/atoms/Avatar.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Avatar from './Avatar.svelte';

describe('Avatar', () => {
  it('renders an img when src is provided', () => {
    render(Avatar, { src: '/p.jpg', alt: 'Sve' });
    expect(screen.getByRole('img', { name: 'Sve' })).toHaveAttribute('src', '/p.jpg');
  });
  it('falls back to initials from alt', () => {
    render(Avatar, { alt: 'Sveinbjörn Geirsson' });
    const el = screen.getByRole('img', { name: 'Sveinbjörn Geirsson' });
    expect(el).toHaveTextContent('SG');
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/atoms/Avatar.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `Avatar.svelte`**

```svelte
<script lang="ts">
  interface Props {
    src?: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { src, alt, size = 'md' }: Props = $props();

  const initials = $derived(
    alt
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  );
</script>

{#if src}
  <img {src} {alt} data-sv="avatar" data-size={size} />
{:else}
  <span data-sv="avatar" data-size={size} role="img" aria-label={alt}>{initials}</span>
{/if}

<style>
  [data-sv='avatar'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    object-fit: cover;
    background: var(--sv-surface-3);
    color: var(--sv-text-strong);
    font-family: var(--sv-font-sans);
    font-weight: 600;
    overflow: hidden;
  }
  [data-size='sm'] { width: 1.75rem; height: 1.75rem; font-size: var(--sv-fs-xs); }
  [data-size='md'] { width: 2.5rem; height: 2.5rem; font-size: var(--sv-fs-sm); }
  [data-size='lg'] { width: 4rem; height: 4rem; font-size: var(--sv-fs-lg); }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/atoms/Avatar.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(atoms): Avatar (image or initials fallback)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 12: Stack (layout primitive)

**Files:**
- Create: `src/lib/components/layout/Stack.svelte`, `src/lib/components/layout/Stack.test.ts`

**Interfaces:**
- Produces: `Stack` props `{ direction?: 'column'|'row'; gap?: 0|1|2|3|4|6|8|12; align?: 'start'|'center'|'end'|'stretch'; justify?: 'start'|'center'|'end'|'between'; wrap?: boolean; children: Snippet }`. Renders a flex container; `gap` maps to `--sv-space-{gap}`.

- [ ] **Step 1: Write failing test**

`src/lib/components/layout/Stack.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Stack from './Stack.svelte';

const kids = createRawSnippet(() => ({ render: () => `<div>child</div>` }));

describe('Stack', () => {
  it('is a column flex container by default', () => {
    const { container } = render(Stack, { children: kids });
    const el = container.querySelector('[data-sv="stack"]') as HTMLElement;
    expect(el).toHaveStyle({ display: 'flex' });
    expect(el).toHaveAttribute('data-direction', 'column');
  });
  it('maps gap to the spacing token', () => {
    const { container } = render(Stack, { gap: 4, children: kids });
    const el = container.querySelector('[data-sv="stack"]') as HTMLElement;
    expect(el.style.getPropertyValue('gap')).toBe('var(--sv-space-4)');
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/layout/Stack.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `Stack.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    direction?: 'column' | 'row';
    gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between';
    wrap?: boolean;
    children: Snippet;
  }

  let {
    direction = 'column',
    gap = 4,
    align = 'stretch',
    justify = 'start',
    wrap = false,
    children
  }: Props = $props();

  const map = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', between: 'space-between' } as const;
</script>

<div
  data-sv="stack"
  data-direction={direction}
  style:flex-direction={direction}
  style:gap={`var(--sv-space-${gap})`}
  style:align-items={map[align]}
  style:justify-content={map[justify]}
  style:flex-wrap={wrap ? 'wrap' : 'nowrap'}
>
  {@render children()}
</div>

<style>
  [data-sv='stack'] { display: flex; }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/layout/Stack.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(layout): Stack primitive

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 13: Card

**Files:**
- Create: `src/lib/components/molecules/Card.svelte`, `src/lib/components/molecules/Card.test.ts`

**Interfaces:**
- Produces: `Card` props `{ padding?: 'sm'|'md'|'lg'; elevated?: boolean; header?: Snippet; footer?: Snippet; children: Snippet }`.

- [ ] **Step 1: Write failing test**

`src/lib/components/molecules/Card.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Card from './Card.svelte';

const snip = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Card', () => {
  it('renders body content', () => {
    render(Card, { children: snip('body') });
    expect(screen.getByText('body').closest('[data-sv="card"]')).toBeInTheDocument();
  });
  it('renders header and footer when provided', () => {
    render(Card, { header: snip('H'), footer: snip('F'), children: snip('B') });
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });
  it('sets elevated flag', () => {
    render(Card, { elevated: true, children: snip('B') });
    expect(screen.getByText('B').closest('[data-sv="card"]')).toHaveAttribute(
      'data-elevated',
      'true'
    );
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/molecules/Card.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `Card.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    padding?: 'sm' | 'md' | 'lg';
    elevated?: boolean;
    header?: Snippet;
    footer?: Snippet;
    children: Snippet;
  }

  let { padding = 'md', elevated = false, header, footer, children }: Props = $props();
</script>

<div data-sv="card" data-padding={padding} data-elevated={elevated}>
  {#if header}<div data-sv="card-header">{@render header()}</div>{/if}
  <div data-sv="card-body">{@render children()}</div>
  {#if footer}<div data-sv="card-footer">{@render footer()}</div>{/if}
</div>

<style>
  [data-sv='card'] {
    background: var(--sv-surface-1);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-lg);
    color: var(--sv-text);
    overflow: hidden;
  }
  [data-elevated='true'] { box-shadow: var(--sv-shadow-md); }
  [data-padding='sm'] [data-sv='card-body'] { padding: var(--sv-space-3); }
  [data-padding='md'] [data-sv='card-body'] { padding: var(--sv-space-4); }
  [data-padding='lg'] [data-sv='card-body'] { padding: var(--sv-space-6); }
  [data-sv='card-header'],
  [data-sv='card-footer'] {
    padding: var(--sv-space-3) var(--sv-space-4);
    background: var(--sv-surface-2);
  }
  [data-sv='card-header'] { border-bottom: 1px solid var(--sv-border); }
  [data-sv='card-footer'] { border-top: 1px solid var(--sv-border); }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/molecules/Card.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(molecules): Card

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 14: CodeBlock (signature component)

**Files:**
- Create: `src/lib/components/molecules/CodeBlock.svelte`, `src/lib/components/molecules/CodeBlock.test.ts`

**Interfaces:**
- Produces: `CodeBlock` props `{ code: string; html?: string; filename?: string; showLineNumbers?: boolean }`.
  - `html` = pre-tokenized markup (from a build-time highlighter whose token classes map to `--sv-syn-*`). When present it is rendered via `{@html}`; **the caller is responsible for producing trusted, highlighter-generated HTML** (documented contract). When absent, `code` renders as plain text.
  - `code` is always the copy-to-clipboard source of truth.

- [ ] **Step 1: Write failing test**

`src/lib/components/molecules/CodeBlock.test.ts`:
```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import CodeBlock from './CodeBlock.svelte';

describe('CodeBlock', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
  });

  it('renders plain code when no html provided', () => {
    render(CodeBlock, { code: 'const x = 1;' });
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('shows a filename header when given', () => {
    render(CodeBlock, { code: 'x', filename: 'app.ts' });
    expect(screen.getByText('app.ts')).toBeInTheDocument();
  });

  it('copies the code source on copy click', async () => {
    render(CodeBlock, { code: 'copy me' });
    screen.getByRole('button', { name: /copy/i }).click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy me');
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/molecules/CodeBlock.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `CodeBlock.svelte`**

```svelte
<script lang="ts">
  interface Props {
    code: string;
    html?: string;
    filename?: string;
    showLineNumbers?: boolean;
  }

  let { code, html, filename, showLineNumbers = false }: Props = $props();
  let copied = $state(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }
</script>

<figure data-sv="codeblock" data-numbered={showLineNumbers}>
  <figcaption>
    <span class="name">{filename ?? ''}</span>
    <button type="button" onclick={copy} aria-label="Copy code">
      {copied ? 'Copied' : 'Copy'}
    </button>
  </figcaption>
  <pre><code>{#if html}{@html html}{:else}{code}{/if}</code></pre>
</figure>

<style>
  [data-sv='codeblock'] {
    margin: 0;
    background: var(--sv-surface-3);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-md);
    overflow: hidden;
  }
  figcaption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sv-space-2) var(--sv-space-3);
    border-bottom: 1px solid var(--sv-border);
    background: var(--sv-surface-2);
  }
  .name { font-family: var(--sv-font-mono); font-size: var(--sv-fs-xs); color: var(--sv-text-muted); }
  figcaption button {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-muted);
    background: transparent;
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-sm);
    padding: 0.1em 0.5em;
    cursor: pointer;
  }
  figcaption button:hover { color: var(--sv-accent); border-color: var(--sv-accent); }
  figcaption button:focus-visible { outline: 2px solid var(--sv-accent); outline-offset: 2px; }
  pre {
    margin: 0;
    padding: var(--sv-space-4);
    overflow-x: auto;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-sm);
    line-height: var(--sv-lh-relaxed);
    color: var(--sv-text);
  }
  /* Token classes emitted by the build-time highlighter map onto syntax tokens. */
  :global([data-sv='codeblock'] .tok-keyword) { color: var(--sv-syn-keyword); }
  :global([data-sv='codeblock'] .tok-string) { color: var(--sv-syn-string); }
  :global([data-sv='codeblock'] .tok-var) { color: var(--sv-syn-var); }
  :global([data-sv='codeblock'] .tok-func) { color: var(--sv-syn-func); }
  :global([data-sv='codeblock'] .tok-comment) { color: var(--sv-syn-comment); }
  :global([data-sv='codeblock'] .tok-number) { color: var(--sv-syn-number); }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/molecules/CodeBlock.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(molecules): CodeBlock (pre-tokenized html, copy, syntax tokens)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 15: NavBar

**Files:**
- Create: `src/lib/components/molecules/NavBar.svelte`, `src/lib/components/molecules/NavBar.test.ts`

**Interfaces:**
- Produces: `NavBar` props `{ brand?: Snippet; children: Snippet }`. Renders `<nav aria-label="Primary">` with a brand slot and a links region that collapses under a toggle below `--sv-bp-md` (768px). Toggle button has `aria-expanded` + `aria-controls`.

- [ ] **Step 1: Write failing test**

`src/lib/components/molecules/NavBar.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import NavBar from './NavBar.svelte';

const snip = (t: string) =>
  createRawSnippet(() => ({ render: () => `<a href="/">${t}</a>` }));

describe('NavBar', () => {
  it('exposes a primary navigation landmark', () => {
    render(NavBar, { children: snip('Home') });
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });
  it('toggle button flips aria-expanded', async () => {
    render(NavBar, { children: snip('Home') });
    const toggle = screen.getByRole('button', { name: /menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    toggle.click();
    await Promise.resolve();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/molecules/NavBar.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `NavBar.svelte`**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    brand?: Snippet;
    children: Snippet;
  }

  let { brand, children }: Props = $props();
  let open = $state(false);
</script>

<nav aria-label="Primary" data-sv="navbar">
  <div class="brand">{#if brand}{@render brand()}{/if}</div>
  <button
    type="button"
    class="toggle"
    aria-label="Menu"
    aria-expanded={open}
    aria-controls="sv-navlinks"
    onclick={() => (open = !open)}
  >≡</button>
  <div id="sv-navlinks" class="links" data-open={open}>
    {@render children()}
  </div>
</nav>

<style>
  [data-sv='navbar'] {
    display: flex;
    align-items: center;
    gap: var(--sv-space-4);
    padding: var(--sv-space-3) var(--sv-space-4);
    background: var(--sv-surface-1);
    border-bottom: 1px solid var(--sv-border);
    position: sticky;
    top: 0;
    z-index: var(--sv-z-sticky);
  }
  .brand { font-family: var(--sv-font-sans); font-weight: 650; color: var(--sv-text-strong); }
  .links { display: flex; gap: var(--sv-space-4); margin-inline-start: auto; }
  .toggle {
    display: none;
    margin-inline-start: auto;
    background: transparent;
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-sm);
    color: var(--sv-text);
    font-size: var(--sv-fs-lg);
    line-height: 1;
    padding: 0 0.4em;
    cursor: pointer;
  }
  .toggle:focus-visible { outline: 2px solid var(--sv-accent); outline-offset: 2px; }
  /* Below --sv-bp-md (768px): collapse links behind the toggle. */
  @media (max-width: 767px) {
    .toggle { display: inline-block; }
    .links {
      display: none;
      position: absolute;
      inset-inline: 0;
      top: 100%;
      flex-direction: column;
      background: var(--sv-surface-1);
      border-bottom: 1px solid var(--sv-border);
      padding: var(--sv-space-3) var(--sv-space-4);
      z-index: var(--sv-z-dropdown);
    }
    .links[data-open='true'] { display: flex; }
  }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/molecules/NavBar.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(molecules): NavBar (responsive collapse, a11y toggle)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 16: StatCard

**Files:**
- Create: `src/lib/components/molecules/StatCard.svelte`, `src/lib/components/molecules/StatCard.test.ts`

**Interfaces:**
- Produces: `StatCard` props `{ value: string; label: string; tone?: 'accent'|'accent-2'|'default' }`. Value rendered large in mono; label muted.

- [ ] **Step 1: Write failing test**

`src/lib/components/molecules/StatCard.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatCard from './StatCard.svelte';

describe('StatCard', () => {
  it('renders value and label', () => {
    render(StatCard, { value: '128', label: 'Deploys' });
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Deploys')).toBeInTheDocument();
  });
  it('applies tone', () => {
    render(StatCard, { value: '9', label: 'x', tone: 'accent-2' });
    expect(screen.getByText('9').closest('[data-sv="statcard"]')).toHaveAttribute(
      'data-tone',
      'accent-2'
    );
  });
});
```

- [ ] **Step 2: Run — verify fail**

Run: `pnpm test src/lib/components/molecules/StatCard.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `StatCard.svelte`**

```svelte
<script lang="ts">
  interface Props {
    value: string;
    label: string;
    tone?: 'accent' | 'accent-2' | 'default';
  }

  let { value, label, tone = 'accent' }: Props = $props();
</script>

<div data-sv="statcard" data-tone={tone}>
  <span class="value">{value}</span>
  <span class="label">{label}</span>
</div>

<style>
  [data-sv='statcard'] {
    display: flex;
    flex-direction: column;
    gap: var(--sv-space-1);
    padding: var(--sv-space-4);
    background: var(--sv-surface-1);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-lg);
  }
  .value {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-3xl);
    line-height: var(--sv-lh-tight);
    font-variant-numeric: tabular-nums;
    color: var(--sv-text-strong);
  }
  [data-tone='accent'] .value { color: var(--sv-accent); }
  [data-tone='accent-2'] .value { color: var(--sv-accent-2); }
  .label {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text-muted);
  }
</style>
```

- [ ] **Step 4: Run — verify pass**

Run: `pnpm test src/lib/components/molecules/StatCard.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(molecules): StatCard

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 17: Barrel exports, package build, dev preview page

**Files:**
- Create: `src/lib/index.ts`
- Create: `src/routes/+page.svelte` (dev-only preview; not packaged)
- Create: `src/lib/index.test.ts`
- Modify: `svelte.config.js` (add SvelteKit? no — see note), `vite.config.ts` (dev page glob)

**Interfaces:**
- Consumes: all components (Tasks 5–16).
- Produces: `src/lib/index.ts` re-exporting every component and its `Props` type; a green `svelte-check`; a `dist/` from `svelte-package`; a `/dev` page rendering all components in dark + light.

Note: This library uses plain `@sveltejs/vite-plugin-svelte`, not SvelteKit. The "dev page" is a standalone Vite entry, not a SvelteKit route. Use `index.html` + `src/dev.ts` mounting a `Dev.svelte`, avoiding a SvelteKit dependency.

- [ ] **Step 1: Write the barrel**

`src/lib/index.ts`:
```ts
export { default as Text } from './components/atoms/Text.svelte';
export { default as Heading } from './components/atoms/Heading.svelte';
export { default as Button } from './components/atoms/Button.svelte';
export { default as Link } from './components/atoms/Link.svelte';
export { default as Badge } from './components/atoms/Badge.svelte';
export { default as Icon } from './components/atoms/Icon.svelte';
export { default as Kbd } from './components/atoms/Kbd.svelte';
export { default as Avatar } from './components/atoms/Avatar.svelte';
export { default as Stack } from './components/layout/Stack.svelte';
export { default as Card } from './components/molecules/Card.svelte';
export { default as CodeBlock } from './components/molecules/CodeBlock.svelte';
export { default as NavBar } from './components/molecules/NavBar.svelte';
export { default as StatCard } from './components/molecules/StatCard.svelte';
```

- [ ] **Step 2: Write a barrel smoke test**

`src/lib/index.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import * as ds from './index';

describe('barrel', () => {
  it('exports all 13 components', () => {
    const names = [
      'Text', 'Heading', 'Button', 'Link', 'Badge', 'Icon', 'Kbd',
      'Avatar', 'Stack', 'Card', 'CodeBlock', 'NavBar', 'StatCard'
    ];
    for (const n of names) expect(ds[n as keyof typeof ds]).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run — verify pass**

Run: `pnpm test src/lib/index.test.ts`
Expected: 1 passed.

- [ ] **Step 4: Create the dev preview entry**

`index.html`:
```html
<!doctype html>
<html lang="en" data-theme="dark">
  <head><meta charset="utf-8" /><title>svnbjrn-design dev</title></head>
  <body><div id="app"></div><script type="module" src="/src/dev.ts"></script></body>
</html>
```

`src/dev.ts`:
```ts
import { mount } from 'svelte';
import './lib/tokens/index.css';
import Dev from './Dev.svelte';

mount(Dev, { target: document.getElementById('app')! });
```

`src/Dev.svelte`:
```svelte
<script lang="ts">
  import { Button, Badge, Card, CodeBlock, StatCard, NavBar, Stack, Heading, Text } from './lib/index';
  let theme = $state<'dark' | 'light'>('dark');
  $effect(() => document.documentElement.setAttribute('data-theme', theme));
</script>

<NavBar>
  {#snippet brand()}svnbjrn{/snippet}
  <button onclick={() => (theme = theme === 'dark' ? 'light' : 'dark')}>Toggle theme</button>
</NavBar>

<Stack gap={6}>
  <Heading level={1}>Components</Heading>
  <Stack direction="row" gap={2}>
    <Button>Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>
  </Stack>
  <Stack direction="row" gap={2}>
    <Badge>neutral</Badge>
    <Badge tone="success">pass</Badge>
    <Badge tone="error">fail</Badge>
    <Badge tone="accent">accent</Badge>
  </Stack>
  <Stack direction="row" gap={4}>
    <StatCard value="128" label="Deploys" />
    <StatCard value="9" label="Open PRs" tone="accent-2" />
  </Stack>
  <Card>
    {#snippet header()}<Text tone="strong">A card</Text>{/snippet}
    <Text>Body text in the card.</Text>
  </Card>
  <CodeBlock code={'const x = 1;\nconsole.log(x);'} filename="demo.ts" />
</Stack>

<style>
  :global(body) { margin: 0; padding: var(--sv-space-6); background: var(--sv-bg); }
</style>
```

- [ ] **Step 5: Verify dev page + check**

Run: `pnpm check`
Expected: `svelte-check found 0 errors`.
Run: `pnpm dev` then open the printed URL; confirm components render and "Toggle theme" flips dark/light. Ctrl-C to stop.

- [ ] **Step 6: Build the package**

Add to `.gitignore`: `dist/`.
Run: `pnpm build`
Expected: `svelte-package` writes `dist/` with `index.js`, `index.d.ts`, `tokens/index.css`, `components/**`, `fonts/**`; `publint` reports no errors.
Run: `test -f dist/tokens/index.css && test -f dist/index.d.ts && echo OK`
Expected: `OK`.

- [ ] **Step 7: Run the full suite**

Run: `pnpm test`
Expected: all tests pass (13 component suites + tokens + fonts + contrast + barrel).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: barrel exports, dev preview page, package build

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- §2 tokens → Tasks 2 (colors), 4 (scale). Accent/mix-target/z-index/breakpoints/focus all present. ✓
- §2 contrast decisions → Task 2 contrast tests. ✓
- §3 fonts (subset, PUA, `font-display: swap`, budget) → Task 3. ✓
- §4 components (Button, Icon, Badge, Text/Heading, Link, Kbd, Avatar, Card, CodeBlock, NavBar, StatCard, Stack) → Tasks 5–16. ✓
- §4 CodeBlock build-time highlighting / pre-tokenized HTML → Task 14. ✓
- §5 structure + build (svelte-package, single stylesheet entry, barrel) → Tasks 1, 4, 17. ✓
- §6 design-sync alignment → satisfied structurally by Task 17 `dist/` layout (no build task needed now). ✓
- §7 testing (Vitest + testing-library, a11y, keyboard) → every component task. ✓
- §8 open items → npm scope (pre-publish, not coded); Iosevka ranges (Task 3, tune if over budget); light-theme validation (Task 2 tests). ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; every test shows real assertions. ✓

**Type consistency:** `contrastRatio(a,b)` used identically in Tasks 2–3 tests. `Palette` keys (no `--sv-` prefix) consumed by generator with `--sv-${k}`. Component `Props` names match their `.test.ts` prop usage and the barrel export names in Task 17 (13 components). `data-sv` attribute convention consistent across components and tests. ✓

**Known follow-ups (documented, not gaps):** publish-time npm scope check; optional real Shiki integration example for consumers (out of v1 scope — component contract is defined and tested).
