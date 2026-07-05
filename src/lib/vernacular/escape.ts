// The single output choke for non-Svelte consumers.
//
// Svelte consumers never call this: `{label}` text and `aria-label={label}`
// are compiler-escaped, and CodeBlock's `{@html html}` is a SEPARATE prop
// vernacular never reaches. But Qt / other native consumers set widget text
// directly (setText / setAccessibleName), and Qt auto-detects rich text — a
// value that looks like `<b>…` gets interpreted — so those pass escape:'html'
// (or set Qt.TextFormat.PlainText). QSS is NOT a sink: vernacular is widget
// text, never a stylesheet value.

import type { Vernacular, VernacularCatalog } from './types.ts';
import { VERNACULAR_REGISTRY } from './registry.ts';

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/** Entity-encode the HTML-significant characters. Guarantees the output can
 * never contain `</script>` or `</style>`. */
export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]!);

export interface VernacularJsonOptions {
  /** 'html' entity-encodes every value (for Qt/WebView); 'none' (default) is raw. */
  escape?: 'none' | 'html';
}

const toFlatEntries = (source: VernacularCatalog | Vernacular): Array<[string, string]> => {
  // Public API: don't throw on null/primitive misuse — return an empty map.
  if (!source || typeof source !== 'object') return [];
  // A parsed catalog already carries dotted keys.
  if ('strings' in source && source.strings instanceof Map) {
    return [...source.strings.entries()];
  }
  // A resolved Vernacular is nested-by-component; flatten via the registry.
  const nested = source as Vernacular;
  const out: Array<[string, string]> = [];
  for (const [key, spec] of VERNACULAR_REGISTRY) {
    const group = nested[spec.component];
    const value = group?.[spec.prop as keyof typeof group];
    if (typeof value === 'string') out.push([key, value]);
  }
  return out;
};

/**
 * Flat resolved JSON of `{ "codeBlock.copyLabel": "…" }` — the channel BONES /
 * non-Svelte consumers read (sibling to ./tokens/*.json). Deterministic
 * (sorted keys).
 */
export const vernacularToJson = (
  source: VernacularCatalog | Vernacular,
  opts: VernacularJsonOptions = {}
): string => {
  const escaped = opts.escape === 'html';
  const entries = toFlatEntries(source).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const obj: Record<string, string> = {};
  for (const [key, value] of entries) obj[key] = escaped ? escapeHtml(value) : value;
  return JSON.stringify(obj, null, 2) + '\n';
};
