// Public types for the untrusted-catalog vernacular runtime
// (@svnbjrn/design/vernacular).
//
// A "world as a data package" has two halves: tokens (the theme engine) and
// strings (this). A world freezes one vernacular catalog — batch-generated,
// human-reviewed — that renames UI labels to match its fiction. Catalogs are
// UNTRUSTED (machine/LLM-generated from user uploads), so they are parsed like
// hostile input, mirroring the theme engine's parse-don't-validate stance.

import type { ComponentProps } from 'svelte';
import type CodeBlock from '../components/molecules/CodeBlock.svelte';
import type NavBar from '../components/molecules/NavBar.svelte';

export type { Result } from '../tokens/resolver.ts';

/**
 * The consumer-facing spread shape: absent keys fall back to the components'
 * English defaults, giving the world → English fallback chain for free.
 * (Relocated from theme/vernacular.ts, which now re-exports this.)
 */
export interface Vernacular {
  /** Spread into CodeBlock: `<CodeBlock {...vernacular.codeBlock} … />` */
  codeBlock?: Pick<ComponentProps<typeof CodeBlock>, 'copyLabel' | 'copiedLabel' | 'copyAriaLabel'>;
  /** Spread into NavBar: `<NavBar {...vernacular.navBar} … />` */
  navBar?: Pick<ComponentProps<typeof NavBar>, 'navLabel' | 'menuLabel'>;
}

export type VernacularIssueCode =
  // fatal — the catalog is rejected
  | 'E_VERN_INPUT' // not an object / unparseable JSON / over the byte cap
  | 'E_VERN_MANIFEST' // bad or missing name / version
  | 'E_VERN_UNKNOWN_KEY' // key not in the registry, under unknownKeys: 'reject'
  // recoverable — the offending key is dropped, the catalog survives, the slot falls back
  | 'E_VERN_TYPE' // value is not a string
  | 'E_VERN_CONTROL' // C0 / C1 / DEL control character
  | 'E_VERN_BIDI' // bidi override / embedding / isolate (Trojan Source set)
  | 'E_VERN_FORMAT' // disallowed zero-width / BOM / word-joiner
  | 'E_VERN_LENGTH' // over the slot's maxLen (code points)
  | 'E_VERN_EMPTY' // blank after trim — would erase the accessible name
  | 'E_VERN_PLACEHOLDER' // {name} set differs from the slot's required set
  // advisory
  | 'W_VERN_DUPLICATE_KEY' // same key given in both dotted and nested form (last wins)
  | 'W_VERN_UNKNOWN_KEY' // skipped: not a known key (unknownKeys: 'skip', default)
  | 'W_VERN_EMPTY_CATALOG' // parsed fine but zero surviving strings — resolve is a no-op
  | 'W_VERN_TERM_MISSING' // terminology coverage gap (checkTerminology)
  | 'W_VERN_TERM_DRIFT' // a forbidden synonym is present (checkTerminology)
  | 'I_VERN_META_IGNORED';

export interface VernacularIssue {
  severity: 'error' | 'warning' | 'info';
  code: VernacularIssueCode;
  /** Dotted catalog key ('codeBlock.copyLabel') when the issue is key-scoped. */
  key?: string;
  message: string;
  detail?: Readonly<Record<string, string | number | readonly string[]>>;
}

export interface VernacularManifest {
  name: string;
  version: string;
  /** Free-form display metadata; never rendered. */
  meta?: Readonly<Record<string, string>>;
}

/** A parsed, validated catalog (mirrors WorldTheme). */
export interface VernacularCatalog {
  manifest: VernacularManifest;
  /** Dotted key ('codeBlock.copyLabel') → hygienic safe text. */
  strings: ReadonlyMap<string, string>;
  issues: readonly VernacularIssue[];
}

/** The JSON shape producers emit / parseVernacular ingests. No `extends` —
 * the fallback tier is the English default, not another catalog. */
export interface VernacularPackage {
  $schema?: string;
  name: string;
  version: string;
  meta?: Record<string, string>;
  /** Nested-by-component or flat dotted keys; values are the world's strings. */
  strings: Record<string, unknown>;
}

export interface ParseVernacularOptions {
  /** Keys not in the registry: skip with a warning (default) or reject the catalog. */
  unknownKeys?: 'skip' | 'reject';
}
