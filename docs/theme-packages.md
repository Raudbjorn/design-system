# World-theme packages

A **world-theme package** is the data format `@svnbjrn/design/theme` ingests
at runtime: a manifest plus sparse [DTCG](https://www.designtokens.org/tr/2025.10/format/)
token overrides. Anything not overridden falls through to the built-in theme
named by `extends` via the CSS cascade — there is no deletion syntax, because
the semantic token set is a closed, total contract (every component requires
every token; "remove a token" is never a valid theme intent).

Packages are treated as **untrusted input** (they are typically derived from
user uploads by an LLM/CV pipeline). Every value is parsed into a typed
representation by a per-`$type` grammar and re-serialized from that
representation — a package string can never reach a stylesheet.

## Shape

```jsonc
{
  "$schema": "https://svnbjrn.dev/schemas/world-theme.v1.json", // optional
  "name": "grimdark-hive",      // ^[a-z0-9][a-z0-9-]{0,63}$
  "version": "1.0.0",           // semver-ish (\d+.\d+.\d+)
  "extends": "dark",            // 'dark' | 'light' (default 'dark')
  "meta": {                     // optional, display only, never emitted as CSS
    "title": "Hive Primus",     // string values ≤256 chars, ≤32 entries
    "mood": "grimdark"
  },
  "tokens": {
    // flat keys…
    "bg":        { "$value": "#141210" },                  // $type optional —
    "accent":    { "$value": "#c9a227" },                  // the contract knows it
    // …or nested groups (flattened with '-'), group $type inheritance:
    "syn": { "$type": "color", "comment": { "$value": "#99916c" } },
    // in-package aliases:
    "accent-rust": { "$value": "{accent-2}" },
    // scale skew:
    "radius-lg": { "$type": "dimension", "$value": "6px" },
    "font-sans": { "$type": "fontFamily", "$value": ["Alegreya", "Georgia", "serif"] }
  }
}
```

`extends` selects **both** the cascade fallthrough base and the palette the
contrast gate evaluates against; the document-scope applier sets `data-theme`
to match, so the two can never disagree.

## Value grammars (per `$type`)

| `$type` | accepted | rejected (examples) |
|---|---|---|
| `color` | `#rgb #rgba #rrggbb #rrggbbaa`, `rgb()/rgba()`, `oklch()` (gamut-clamped) | named colors, `var()`, `color-mix()`, escapes, >64 chars; **alpha on any semantic color** (ratios are undefined against an unknown backdrop) |
| `dimension` | `"6px"`, `"0.25rem"`, `{value, unit}`; ≥0, ≤1000px / ≤64rem | negatives, `vh`/`%`, `calc()`, exponents |
| `number` | finite, 0 < n ≤ 100 | everything else |
| `fontWeight` | 1–1000, `normal`, `bold` | out of range |
| `fontFamily` | ≤4 names, `^[A-Za-z0-9][A-Za-z0-9 _-]{0,63}$` or generic keywords | quotes, `;{}()<>\/@,` — the injection charset |
| `shadow` | DTCG object(s) ≤4 layers, fields validated by the color/dimension grammars (alpha **is** legal on shadow colors) | raw strings, negative blur, offsets >100px |

Token names must exist in the contract registry (`SV_TOKEN_REGISTRY`).
`z-*` and `bp-*` are hard-locked (worlds restyle color/type/shape, never
stacking contexts or layout thresholds); applications may lock more via
`lockedTokens` (BONES locks `success`/`error`/`warning`).

## The contrast gate

Rules (one source of truth, `CONTRAST_RULES` — the same table
`palette.test.ts` holds the built-in themes to):

- `text`, `text-strong`, `text-muted`, `text-faint` ≥ 4.5:1 on `bg`
- `accent`, `accent-2` ≥ 3:1 on `bg`
- all six `syn-*` ≥ 4.5:1 on `surface-3` (the CodeBlock background)
- `success`, `error`, `warning`, `accent-rust` ≥ 3:1 on `bg`
- `text-strong`, `text`, `text-muted` ≥ 4.5:1 on `surface-3`

Evaluated on the **effective palette** (`override ?? base[extends]`), so a
package overriding only `bg` still has the inherited text checked against the
new background. Policy via `onContrastFailure`:

- `'revert'` (default) — drop the offending override(s), fall back to the
  built-in value, report `W_CONTRAST_REVERTED` with ratios. A world theme is
  an enhancement; one bad extracted color costs that color, not the world.
- `'reject'` — fail the parse (`E_CONTRAST`), for strict consumers/CI.
- `'keep'` — apply anyway with `W_CONTRAST_FAILED` warnings (raw-preview UIs).

## Issues

Every decision is a `ThemeIssue { severity, code, token?, message, detail? }`.
Fatal: `E_INPUT`, `E_MANIFEST`, `E_DTCG` (bad tree/alias cycle),
`E_CONTRAST` (reject policy), `E_UNKNOWN_TOKEN` (reject policy). Recoverable
(token dropped, parse survives): `E_TYPE_MISMATCH`, `E_VALUE`,
`E_ALPHA_ON_GATED`. Advisory: `W_UNKNOWN_TOKEN`, `W_LOCKED_TOKEN`,
`W_CONTRAST_REVERTED`, `W_CONTRAST_FAILED`, `W_EMPTY`, `I_META_IGNORED`,
`I_MIX_TARGET_OVERRIDE`.

## Producing packages

Hand-write them, or generate them: `@svnbjrn/design/generate` (library and
`design-generate` CLI) turns 1–5 seed colors + atmosphere hints into a
complete package whose every pairing passes the gate **by construction**.
Freeze generated packages as data (Foundry-style), version them, and
regenerate only when the source material changes — `meta.generator` carries
the algorithm version for cache keys.
