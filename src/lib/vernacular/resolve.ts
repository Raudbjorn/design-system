// Fallback + plain-language toggle. The chain is world → English default → raw
// key, realized by OMISSION: a key with no surviving override is simply not
// placed, so the component's own default prop renders (the established
// "absent key → English default" contract). The single source of English is
// the component props themselves (plainDefault mirrors them, lockstep-tested).

import { VERNACULAR_REGISTRY } from './registry.ts';
import type { Vernacular, VernacularCatalog } from './types.ts';

export interface ResolveVernacularOptions {
  /**
   * Force every slot to its English default (diegetic authenticity-vs-usability
   * escape hatch): resolve as if there were no catalog. `false` (default) uses
   * the world's overrides where present.
   */
  plainLanguage?: boolean;
}

type MutableVernacular = {
  [K in keyof Vernacular]: Record<string, string>;
};

/**
 * Resolve a catalog into the spreadable Vernacular shape. Keys with no override
 * are left absent so the component default applies; `plainLanguage: true`
 * returns `{}` so every component renders its built-in English.
 */
export const resolveVernacular = (
  catalog: VernacularCatalog | null,
  opts: ResolveVernacularOptions = {}
): Vernacular => {
  if (!catalog || opts.plainLanguage) return {};
  const out: MutableVernacular = {};
  for (const [key, spec] of VERNACULAR_REGISTRY) {
    const value = catalog.strings.get(key);
    if (value === undefined) continue; // world → English (omission)
    (out[spec.component] ??= {})[spec.prop] = value;
  }
  return out as Vernacular;
};
