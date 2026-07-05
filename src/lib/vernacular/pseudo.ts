// Pseudo-localization — a dev/CI transform that surfaces i18n bugs before a
// real world catalog exists: (1) accent-map ASCII letters to homoglyphs so
// hard-coded/untranslated English stands out; (2) length-inflate ~1.4x to
// simulate German/Finnish expansion and surface truncation; (3) bracket with
// [[ … ]] so clipping (missing bracket) and illegitimate concatenation are
// visible. Placeholder spans are copied verbatim so substitution still works.
// Deterministic; the output re-parses clean through parseSafeString.

import { VERNACULAR_REGISTRY } from './registry.ts';
import type { Vernacular, VernacularCatalog } from './types.ts';

// ASCII → accented homoglyph (NFC single code points, no control/bidi/format).
const ACCENTS: Readonly<Record<string, string>> = {
  a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ',
  k: 'ķ', l: 'ł', m: 'ɱ', n: 'ñ', o: 'ö', p: 'þ', q: 'ʠ', r: 'ŕ', s: 'š', t: 'ţ',
  u: 'ü', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Á', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Í', J: 'Ĵ',
  K: 'Ķ', L: 'Ł', M: 'Ɱ', N: 'Ñ', O: 'Ö', P: 'Þ', Q: 'Q', R: 'Ŕ', S: 'Š', T: 'Ţ',
  U: 'Ü', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž'
};

const PLACEHOLDER_RE = /\{[a-zA-Z][a-zA-Z0-9_]*\}/g;

const accentSegment = (segment: string): string =>
  [...segment].map((ch) => ACCENTS[ch] ?? ch).join('');

/** Accent the letters, inflate to ~1.4x, and bracket — leaving `{placeholders}`
 * verbatim. */
export const pseudoLocalizeString = (text: string): string => {
  // Split around placeholder spans so they pass through untouched.
  const parts: string[] = [];
  let last = 0;
  for (const m of text.matchAll(PLACEHOLDER_RE)) {
    parts.push(accentSegment(text.slice(last, m.index)));
    parts.push(m[0]); // placeholder verbatim
    last = m.index + m[0].length;
  }
  parts.push(accentSegment(text.slice(last)));
  const accented = parts.join('');

  // Deterministic inflation: pad to ceil(1.4x) code points with a filler run,
  // measured on the accented-but-not-yet-bracketed text.
  const baseLen = [...accented].length;
  const target = Math.ceil(baseLen * 1.4);
  const padCount = Math.max(0, target - baseLen);
  const pad = padCount > 0 ? ' ' + 'ơ'.repeat(padCount - 1) : '';
  return `[[${accented}${pad}]]`;
};

/** Pseudo-localize every registry slot to its own English default. */
export const pseudoLocalize = (source?: VernacularCatalog | Vernacular): Vernacular => {
  const out: Record<string, Record<string, string>> = {};
  for (const [key, spec] of VERNACULAR_REGISTRY) {
    const original = pick(source, key, spec.component, spec.prop) ?? spec.plainDefault;
    (out[spec.component] ??= {})[spec.prop] = pseudoLocalizeString(original);
  }
  return out as Vernacular;
};

const pick = (
  source: VernacularCatalog | Vernacular | undefined,
  key: string,
  component: string,
  prop: string
): string | undefined => {
  if (!source) return undefined;
  if ('strings' in source && source.strings instanceof Map) return source.strings.get(key);
  const group = (source as Record<string, Record<string, string> | undefined>)[component];
  return group?.[prop];
};
