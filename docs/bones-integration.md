# BONES integration guide

How BONES (SvelteKit `ui/`, Tauri desktop, PySide6 `apps/desktop_pyside`,
Python backend) consumes `@svnbjrn/design` for per-campaign world theming.

## Web + Tauri (both are webviews — same path)

1. **Styles + boot script** in `app.html`:

   ```html
   <head>
     <script>/* paste themeBootScript here — BEFORE stylesheet links */</script>
     <!-- stylesheets -->
   </head>
   ```

   ```ts
   import '@svnbjrn/design/styles.css';
   import { themeBootScript } from '@svnbjrn/design/theme'; // string constant
   ```

   The boot script restores the persisted dark/light mode and re-applies the
   validated, localStorage-cached world CSS before first paint. First-ever
   world application is inherently post-JS (user-triggered); repeat visits
   paint themed. SSR alternative when the server knows the campaign:
   `<svelte:head><style>{worldThemeToCss(theme)}</style></svelte:head>`.

2. **Campaign switching**:

   ```ts
   import { createWorldTheme } from '@svnbjrn/design/theme/svelte';

   const world = createWorldTheme();
   await world.load(campaign.themePackage, {
     lockedTokens: ['success', 'error', 'warning'] // handoff: status never themes
   });
   // world.issues → surface "N extracted tones were adjusted for readability"
   ```

3. **Appearance panel** (live tweaking): parse with
   `onContrastFailure: 'keep'` to preview the raw extraction alongside the
   gated version; `WorldThemeHandle.update()` swaps CSS in place with no
   flash. Scoped previews: `applyWorldTheme(theme, { scope: paneElement })`.

4. **Token-name mapping**: the design handoff's vocabulary maps onto the
   `--sv-*` contract at adoption time — `--app` → `--sv-bg`, `--surface` →
   `--sv-surface-1`, `--surface2` → `--sv-surface-2`, `--inset` →
   `--sv-surface-3`, `--line` → `--sv-border`, `--btn2` → `--sv-surface-2`.

## PySide6 (`apps/desktop_pyside`)

Whole-app QSS swap from the packaged sheets:

```python
from pathlib import Path

design = Path("node_modules/@svnbjrn/design")
app.setStyleSheet((design / "dist/qss/dark.qss").read_text())
```

- Variant widgets use dynamic properties + re-polish (Qt does not restyle on
  property changes):

  ```python
  button.setProperty("class", "primary")
  button.style().unpolish(button); button.style().polish(button); button.update()
  ```

- Custom chrome templates from the flat resolved map
  (`dist/tokens/resolved/dark.tokens.json`): `tokens[name].qt` values plus
  `derived["accent-hover"]`/`…-pressed` (precomputed with the same oklab math
  as the web hover convention).
- Per-campaign QSS: generate the theme package (below), then run the token
  values through your Jinja2 QSS template, or regenerate the sheet by adding
  the world to `themes.ts` at build time for compiled-in worlds.

## Generation (Python backend)

Shell out to the CLI; stdout is exactly one JSON document:

```python
import json, subprocess

result = subprocess.run(
    ["node", "node_modules/@svnbjrn/design/bin/design-generate.mjs",
     "--seeds", ",".join(kmeans_dominants),   # 1–5 hex, dominance order —
     "--name", world_id,                       # first chromatic seed = accent
     "--hints", ",".join(atmosphere_keywords)],
    capture_output=True, text=True, check=False,
)
if result.returncode == 0:
    payload = json.loads(result.stdout)       # {"theme": …, "report": …}
elif result.returncode == 2:
    gen_error = json.loads(result.stderr)     # invalid input
```

Cache `payload["theme"]` keyed on
`(seeds, mode, hints, theme["meta"]["generator"])` — output is
deterministic per JS engine and the generator version changes when the
algorithm does. Exit codes: 0 ok, 2 invalid input, 3 warnings under
`--strict`, 1 crash.

Extraction stays on the BONES side (segmentation → K-Means in a perceptual
space → atmosphere keywords). Hand this library seeds and hints; it owns
ramps, assignment, and the AA guarantee.

## Contract locks (from the design handoff)

- Status colors never theme: pass `lockedTokens: ['success','error','warning']`.
- `z-*` / `bp-*` are hard-locked in the registry — worlds cannot move
  stacking contexts or breakpoints.
- Vernacular/i18n and behavioral adaptation are BONES-side concerns; this
  library owns visual tokens only.
