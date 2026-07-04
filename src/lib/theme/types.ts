// Public types for the runtime world-theme engine (@svnbjrn/design/theme).

import type { Result } from '../tokens/resolver.ts';

export type { Result };

export type ThemeIssueCode =
  // fatal — the package is rejected
  | 'E_INPUT' // not an object / unparseable JSON string
  | 'E_MANIFEST' // bad or missing name / version / extends
  | 'E_DTCG' // token tree failed structural resolution (malformed, bad alias, cycle)
  | 'E_CONTRAST' // gate failure under onContrastFailure: 'reject'
  | 'E_UNKNOWN_TOKEN' // unknown token under unknownTokens: 'reject'
  // recoverable — the offending token is dropped, the parse survives
  | 'E_TYPE_MISMATCH' // declared $type disagrees with the registry
  | 'E_VALUE' // value fails its $type grammar
  | 'E_ALPHA_ON_GATED' // translucent color on a semantic color token
  // advisory
  | 'W_CONTRAST_REVERTED' // gate failure auto-reverted to the built-in value
  | 'W_CONTRAST_FAILED' // gate failure retained under onContrastFailure: 'keep'
  | 'W_UNKNOWN_TOKEN'
  | 'W_LOCKED_TOKEN'
  | 'W_EMPTY' // parsed fine but zero surviving overrides
  | 'I_META_IGNORED'
  | 'I_MIX_TARGET_OVERRIDE'
  // apply-time
  | 'E_NO_DOM'
  | 'E_BAD_SCOPE';

export interface ThemeIssue {
  severity: 'error' | 'warning' | 'info';
  code: ThemeIssueCode;
  /** Semantic token name (no --sv- prefix) when the issue is token-scoped. */
  token?: string;
  /** DTCG path inside the package's tokens tree, when different from token. */
  path?: string;
  message: string;
  /** Structured details (ratios, floors, reverted-to values, …). */
  detail?: Readonly<Record<string, string | number>>;
}

export interface WorldThemeManifest {
  name: string;
  version: string;
  /** Built-in theme the world extends: cascade fallthrough AND gate base. */
  extends: 'dark' | 'light';
  /** Free-form display metadata; never emitted into CSS. */
  meta?: Readonly<Record<string, string>>;
}

/**
 * A parsed, validated, gate-checked world theme. `tokens` maps semantic token
 * names (no --sv- prefix) to CSS-safe serialized values — every value has
 * been through its $type grammar; nothing in this map can break out of a
 * declaration.
 */
export interface WorldTheme {
  manifest: WorldThemeManifest;
  tokens: ReadonlyMap<string, string>;
  /** Non-fatal findings from parse + gate. */
  issues: readonly ThemeIssue[];
}

export interface ParseWorldThemeOptions {
  /**
   * What to do when an override fails a contrast rule:
   *  - 'revert' (default): drop the offending override(s) so the pair falls
   *    back to the built-in value — the theme applies, degraded, with a
   *    machine-readable report. A world theme is an enhancement; one bad
   *    extracted color should cost that color, not the world.
   *  - 'reject': fail the parse (strict consumers / CI).
   *  - 'keep': apply anyway, failures downgraded to warnings (raw-preview /
   *    editor tooling).
   */
  onContrastFailure?: 'revert' | 'reject' | 'keep';
  /** Unknown token names: skip with a warning (default) or fail the parse. */
  unknownTokens?: 'skip' | 'reject';
  /** Consumer policy locks, e.g. BONES locks ['success','error','warning']. */
  lockedTokens?: readonly string[];
}

/** The JSON shape producers emit (what parseWorldTheme ingests). */
export interface WorldThemePackage {
  $schema?: string;
  name: string;
  version: string;
  extends?: 'dark' | 'light';
  meta?: Record<string, string>;
  /** DTCG subtree: flat keys ("surface-1") or nested groups (syn.keyword →
   * syn-keyword); values may alias other tokens in the package. */
  tokens: Record<string, unknown>;
}
