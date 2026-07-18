// The single output choke for non-Svelte consumers.
//
// JSON values stay plain text so native text and accessibility APIs receive
// the characters users should see and hear. HTML consumers must call
// escapeHtml at the actual HTML sink; Qt consumers must set Qt::PlainText.
// QSS is not a sink: vernacular is widget text, never a stylesheet value.

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
  /** Ignore world overrides and emit every registry slot's English default. */
  plainLanguage?: boolean;
}

const toFlatEntries = (
  source: VernacularCatalog | Vernacular,
  plainLanguage: boolean
): Array<[string, string]> => {
  // Public API: don't throw on null/primitive misuse — return an empty map.
  if (!source || typeof source !== 'object') return [];

  const overrides = new Map<string, string>();
  const candidate = 'strings' in source ? source.strings : undefined;
  if (
    candidate &&
    typeof candidate === 'object' &&
    typeof candidate.entries === 'function'
  ) {
    for (const [key, value] of candidate.entries()) {
      if (VERNACULAR_REGISTRY.has(key) && typeof value === 'string') overrides.set(key, value);
    }
  } else {
    const nested = source as Vernacular;
    for (const [key, spec] of VERNACULAR_REGISTRY) {
      const group = nested[spec.component];
      const value = group?.[spec.prop as keyof typeof group];
      if (typeof value === 'string') overrides.set(key, value);
    }
  }

  const out: Array<[string, string]> = [];
  for (const [key, spec] of VERNACULAR_REGISTRY) {
    out.push([key, plainLanguage ? spec.plainDefault : (overrides.get(key) ?? spec.plainDefault)]);
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
  const entries = toFlatEntries(source, opts.plainLanguage ?? false).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  const obj: Record<string, string> = {};
  for (const [key, value] of entries) obj[key] = value;
  return JSON.stringify(obj, null, 2) + '\n';
};
