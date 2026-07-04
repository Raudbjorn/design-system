// Shared data preparation for the token build: loads the DTCG sources,
// resolves every registry theme, enforces the cross-theme invariants, and
// returns plain serializable rows the emitters (and the drift-guard test)
// consume. Errors are values — the caller decides how to exit.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  mergeDocuments,
  parseTokenDocument,
  resolveTokens,
  toCss,
  toQt
} from '../../src/lib/tokens/resolver.ts';
import { themes } from '../../src/lib/tokens/themes.ts';
import { mixOklab } from '../../src/lib/internal/color.ts';

const here = dirname(fileURLToPath(import.meta.url));
export const TOKENS_DIR = join(here, '../../src/lib/tokens');

/** Mix weights for derived interaction states. hover mirrors the web
 * convention (color-mix(in oklab, C, var(--sv-mix-target) 15%)); pressed is
 * a new Qt-side convention, one step past hover — tune here if it reads
 * too strong on real widgets. */
export const HOVER_MIX = 0.15;
export const PRESSED_MIX = 0.25;

/** Semantic tokens that get -hover/-pressed derivations. */
const DERIVED_TOKENS = ['accent', 'accent-2', 'error', 'surface-1', 'surface-2', 'surface-3'];

const BASE_FILES = ['primitives.tokens.json', 'scale.tokens.json'];

const loadDoc = (name, errors) => {
  let json;
  try {
    json = JSON.parse(readFileSync(join(TOKENS_DIR, name), 'utf8'));
  } catch (e) {
    errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    return null;
  }
  const parsed = parseTokenDocument(json, name);
  if (!parsed.ok) {
    for (const err of parsed.error) errors.push(`${name}: ${err.kind} at ${err.path}: ${err.message}`);
    return null;
  }
  return parsed.value;
};

const rowsOf = (resolved, group) => {
  const rows = [];
  for (const token of resolved.values()) {
    const segments = token.path.split('.');
    if (segments.length === 2 && segments[0] === group) {
      const row = {
        key: segments[1],
        type: token.type,
        css: toCss(token.value),
        qt: toQt(token.value)
      };
      if (token.description !== undefined) row.description = token.description;
      rows.push(row);
    }
  }
  return rows;
};

const resolveOrCollect = (docs, label, errors) => {
  const result = resolveTokens(mergeDocuments(docs));
  if (!result.ok) {
    for (const err of result.error) errors.push(`${label}: ${err.kind} at ${err.path}: ${err.message}`);
    return null;
  }
  return result.value;
};

/**
 * @returns {{ ok: true, value: { base: { scale: any[] }, themes: any[] } } |
 *           { ok: false, error: string[] }}
 */
export const prepareBuild = () => {
  const errors = [];
  const baseDocs = BASE_FILES.map((f) => loadDoc(f, errors));
  if (errors.length > 0) return { ok: false, error: errors };

  const baseResolved = resolveOrCollect(baseDocs, 'base', errors);
  if (!baseResolved) return { ok: false, error: errors };
  const baseScale = rowsOf(baseResolved, 'scale');

  const preparedThemes = [];
  for (const spec of themes) {
    const themeDocs = spec.files.map((f) => loadDoc(f, errors));
    if (themeDocs.some((d) => d === null)) continue;
    const resolved = resolveOrCollect([...baseDocs, ...themeDocs], spec.name, errors);
    if (!resolved) continue;

    const colors = rowsOf(resolved, 'color');
    const scaleFull = rowsOf(resolved, 'scale');
    const baseCss = new Map(baseScale.map((r) => [r.key, r.css]));
    const scaleDiff = scaleFull.filter((r) => baseCss.get(r.key) !== r.css);

    const paletteHex = Object.fromEntries(colors.map((r) => [r.key, r.css]));
    const mixTarget = paletteHex['mix-target'];
    if (mixTarget === undefined) {
      errors.push(`${spec.name}: theme defines no color.mix-target (needed for derived states)`);
      continue;
    }
    const derived = [];
    for (const key of DERIVED_TOKENS) {
      const value = paletteHex[key];
      if (value === undefined) continue; // key-set invariant reports this below
      derived.push({ key: `${key}-hover`, css: mixOklab(value, mixTarget, HOVER_MIX) });
      derived.push({ key: `${key}-pressed`, css: mixOklab(value, mixTarget, PRESSED_MIX) });
    }

    preparedThemes.push({
      name: spec.name,
      isDefault: spec.default === true,
      prefersColorScheme: spec.prefersColorScheme,
      colors,
      scaleFull,
      scaleDiff,
      paletteHex,
      derived
    });
  }
  if (errors.length > 0) return { ok: false, error: errors };

  const defaults = preparedThemes.filter((t) => t.isDefault);
  if (defaults.length !== 1) {
    errors.push(`exactly one theme must be default:true (found ${defaults.length})`);
  }
  const first = preparedThemes[0];
  if (first) {
    const reference = first.colors.map((r) => r.key).sort().join(',');
    for (const theme of preparedThemes.slice(1)) {
      const keys = theme.colors.map((r) => r.key).sort().join(',');
      if (keys !== reference) {
        errors.push(
          `theme "${theme.name}" color key set differs from "${first.name}" — every theme must define the identical semantic contract`
        );
      }
    }
  }
  if (errors.length > 0) return { ok: false, error: errors };

  return { ok: true, value: { base: { scale: baseScale }, themes: preparedThemes } };
};
