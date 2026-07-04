// Theme-as-data: accept a palette override (hand-written or machine-extracted),
// validate it, gate it for accessibility, and apply it as plain CSS custom
// properties layered over the library defaults.
//
// Two hard rules, both errors-as-values:
//  - Zero-trust values. Overrides may come from an extraction pipeline (LLM,
//    K-Means, …); only 6-digit hex colors for known token names pass. Anything
//    else is rejected before it can reach a stylesheet (CSS injection guard).
//  - Contrast by construction. Every text/background pairing the base palettes
//    guarantee (see contrastGates) is re-checked on the merged palette; a theme
//    that ships illegible text is not a theme, it's an issue list.
import { dark, light } from '../tokens/palette.js';
import type { Palette, TokenName } from '../tokens/palette.js';
import { contrastRatio } from '../internal/contrast.js';

/**
 * The WCAG pairings every palette must satisfy — the same invariants
 * palette.test.ts enforces on the built-in dark and light palettes.
 * 4.5:1 is AA for normal text; 3:1 is AA for UI components and large text.
 */
export const contrastGates: ReadonlyArray<{ fg: TokenName; bg: TokenName; min: number }> = [
  { fg: 'text', bg: 'bg', min: 4.5 },
  { fg: 'text-strong', bg: 'bg', min: 4.5 },
  { fg: 'text-muted', bg: 'bg', min: 4.5 },
  { fg: 'text-faint', bg: 'bg', min: 4.5 },
  { fg: 'accent', bg: 'bg', min: 3 },
  { fg: 'accent-2', bg: 'bg', min: 3 },
  { fg: 'syn-keyword', bg: 'surface-3', min: 4.5 },
  { fg: 'syn-string', bg: 'surface-3', min: 4.5 },
  { fg: 'syn-var', bg: 'surface-3', min: 4.5 },
  { fg: 'syn-func', bg: 'surface-3', min: 4.5 },
  { fg: 'syn-comment', bg: 'surface-3', min: 4.5 },
  { fg: 'syn-number', bg: 'surface-3', min: 4.5 }
];

export type ThemeIssue =
  | { kind: 'unknown-token'; token: string }
  | { kind: 'invalid-color'; token: TokenName; value: string }
  | { kind: 'contrast'; fg: TokenName; bg: TokenName; ratio: number; min: number };

export interface Theme {
  /** The accepted overrides only — what themeCss emits. */
  overrides: Partial<Palette>;
  /** The full merged palette (base + overrides) the gates were checked on. */
  palette: Palette;
}

export type ThemeResult = { ok: true; theme: Theme } | { ok: false; issues: ThemeIssue[] };

export interface DefineThemeOptions {
  /**
   * Palette the overrides merge over for contrast gating: the built-in
   * `'dark'` (default) or `'light'` palette, or a full custom palette.
   * Pick the base the theme will actually layer over at runtime.
   */
  base?: 'dark' | 'light' | Palette;
}

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Validate a partial palette override into a Theme.
 *
 * Collects every problem instead of failing fast — an extraction pipeline can
 * drop the offending tokens (each issue names them) and retry, clamping to the
 * base palette rather than shipping raw extracted colors.
 *
 * Accepts either a single override record or an ordered array of layers that
 * merge in order, later wins — implementing the strict
 * `base → world → activity → user-override` precedence; a single record is the
 * one-layer case.
 */
export function defineTheme(
  overrides: Record<string, string> | ReadonlyArray<Record<string, string>>,
  options: DefineThemeOptions = {}
): ThemeResult {
  const layers: ReadonlyArray<Record<string, string>> = Array.isArray(overrides) ? overrides : [overrides];
  const base =
    options.base === 'light' ? light : options.base === undefined || options.base === 'dark' ? dark : options.base;

  const issues: ThemeIssue[] = [];
  // Plain Record: Partial<Palette> would widen every read to
  // `string | undefined` now that the generated Palette is an open
  // Record<string, string> — the hasOwn gate above is what bounds the keys.
  const accepted: Record<string, string> = {};
  for (const layer of layers) {
    for (const [token, value] of Object.entries(layer)) {
      if (!Object.hasOwn(dark, token)) {
        issues.push({ kind: 'unknown-token', token });
        continue;
      }
      if (!HEX.test(value)) {
        issues.push({ kind: 'invalid-color', token: token as TokenName, value });
        continue;
      }
      accepted[token] = value.toLowerCase();
    }
  }

  const palette: Palette = { ...base, ...accepted };
  for (const { fg, bg, min } of contrastGates) {
    const fgHex = palette[fg];
    const bgHex = palette[bg];
    // The built-in palettes carry every gated token; a custom `base` is an
    // open Record and may not — a pair the effective palette doesn't define
    // has nothing to gate.
    if (fgHex === undefined || bgHex === undefined) continue;
    const ratio = contrastRatio(fgHex, bgHex);
    if (ratio < min) issues.push({ kind: 'contrast', fg, bg, ratio, min });
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, theme: { overrides: accepted, palette } };
}

/**
 * Render a theme's overrides as a CSS custom-property block.
 * Output is deterministic (sorted) and, by defineTheme's construction,
 * contains only `--sv-*: #rrggbb;` declarations.
 */
export function themeCss(theme: Theme, selector = ':root'): string {
  const decls = (Object.entries(theme.overrides) as [TokenName, string][])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([token, value]) => `  --sv-${token}: ${value};`);
  return `${selector} {\n${decls.join('\n')}\n}\n`;
}

export interface ApplyThemeOptions {
  /** Scope for the overrides; defaults to `:root`. */
  selector?: string;
  /** Document to style; defaults to the global one. */
  target?: Document;
}

/**
 * Apply a theme to a document and return a disposer that removes it —
 * every adaptation stays reversible. Uses a constructable stylesheet where
 * supported, a `<style>` element otherwise. Either way the injected CSS is
 * unlayered, so it beats the library's `sv.tokens` cascade layer.
 *
 * DOM-only: call client-side (e.g. inside `onMount`/`$effect`).
 */
export function applyTheme(theme: Theme, options: ApplyThemeOptions = {}): () => void {
  const doc = options.target ?? (typeof document === 'undefined' ? undefined : document);
  if (!doc) {
    throw new Error('applyTheme needs a DOM document — call it client-side or pass options.target.');
  }
  const css = themeCss(theme, options.selector);

  if ('adoptedStyleSheets' in doc && typeof CSSStyleSheet === 'function') {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
      return () => {
        doc.adoptedStyleSheets = doc.adoptedStyleSheets.filter((s) => s !== sheet);
      };
    } catch {
      // Engines (jsdom included) that expose CSSStyleSheet but reject direct
      // construction fall through to the <style> path.
    }
  }

  const el = doc.createElement('style');
  el.setAttribute('data-sv-theme', '');
  el.textContent = css;
  doc.head.appendChild(el);
  return () => el.remove();
}

export interface SwapThemeOptions extends ApplyThemeOptions {
  /** Disposer from a previous applyTheme/swapTheme, removed inside the same transition frame. */
  dispose?: () => void;
}

/**
 * Swap to a theme, animating with the View Transitions API where available:
 * the old-theme removal and new-theme injection happen synchronously inside
 * the transition's update callback so the browser snapshots both states.
 * Falls back to an instant swap. Resolves once the new styles are in the DOM
 * (`updateCallbackDone`) — the crossfade finishes on its own.
 *
 * DOM-only: call client-side (e.g. inside `onMount`/`$effect`).
 */
export async function swapTheme(theme: Theme, options: SwapThemeOptions = {}): Promise<() => void> {
  const doc = options.target ?? (typeof document === 'undefined' ? undefined : document);
  if (!doc) {
    throw new Error('swapTheme needs a DOM document — call it client-side or pass options.target.');
  }
  let next: (() => void) | undefined;
  const mutate = () => {
    options.dispose?.();
    next = applyTheme(theme, options);
  };
  // Runtime feature detection — jsdom and older engines lack View Transitions.
  if (typeof doc.startViewTransition === 'function') {
    await doc.startViewTransition(mutate).updateCallbackDone;
  } else {
    mutate();
  }
  return next!;
}
