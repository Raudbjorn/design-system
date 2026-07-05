// Thin Svelte 5 rune wrapper over the vernacular runtime —
// `@svnbjrn/design/vernacular/svelte`. Parallels createWorldTheme. Parsing and
// resolving are synchronous, so there is no async-race guard to carry.

import { parseVernacular } from './parse.ts';
import { resolveVernacular } from './resolve.ts';
import type { ParseVernacularOptions, Vernacular, VernacularCatalog, VernacularIssue } from './types.ts';

export interface VernacularState {
  /** Resolved, spreadable into components. Re-derives when plainLanguage flips. */
  readonly current: Vernacular;
  /** Issues from the last load attempt. */
  readonly issues: readonly VernacularIssue[];
  /** Force English defaults everywhere (the diegetic escape hatch). Reactive. */
  plainLanguage: boolean;
  /** Parse + adopt a catalog. Returns false when rejected (see issues). */
  load(json: unknown, opts?: ParseVernacularOptions): boolean;
  /** Drop the catalog; components fall back to English. */
  clear(): void;
}

export function createVernacular(): VernacularState {
  let catalog = $state<VernacularCatalog | null>(null);
  let issues = $state<readonly VernacularIssue[]>([]);
  let plain = $state(false);
  const current = $derived(resolveVernacular(catalog, { plainLanguage: plain }));

  return {
    get current() {
      return current;
    },
    get issues() {
      return issues;
    },
    get plainLanguage() {
      return plain;
    },
    set plainLanguage(value: boolean) {
      plain = value;
    },
    load(json: unknown, opts?: ParseVernacularOptions): boolean {
      const parsed = parseVernacular(json, opts);
      if (!parsed.ok) {
        issues = parsed.error;
        catalog = null;
        return false;
      }
      catalog = parsed.value;
      issues = parsed.value.issues;
      return true;
    },
    clear(): void {
      catalog = null;
      issues = [];
    }
  };
}
