// worldThemeToCss — pure WorldTheme → stylesheet text. Used by the DOM
// applier, the SSR path (<svelte:head>), and the boot cache. Every value in
// theme.tokens has been through its grammar; this module only assembles
// structure around them.

import type { WorldTheme } from './types.ts';

/** Exact prefix of every engine-emitted sheet — the boot script's cache
 * integrity sentinel. Do not change without updating boot.ts. */
export const CSS_SENTINEL = '/*sv-world*/';

const LAYER_ORDER = '@layer sv.base, sv.theme, sv.world, sv.user;';

// :root, or an engine-generated/consumer-provided scope attribute selector.
// Braces and other structure-breaking characters are a programmer error, not
// data — theme values never reach this parameter.
const SELECTOR_RE = /^[a-zA-Z0-9:*[\]="'()\-_.#\s,>+~]+$/;

export interface WorldThemeCssOptions {
  selector?: string;
  layer?: 'world' | 'user';
  /** Emit the defensive layer-order statement (default true) so world CSS
   * works even when it is the first layered stylesheet the document sees. */
  layerOrderStatement?: boolean;
}

export const worldThemeToCss = (theme: WorldTheme, opts: WorldThemeCssOptions = {}): string => {
  const selector = opts.selector ?? ':root';
  if (!SELECTOR_RE.test(selector) || selector.includes('{') || selector.includes('}')) {
    throw new TypeError(`worldThemeToCss: unsafe selector "${selector}"`);
  }
  const layer = opts.layer ?? 'world';
  const lines = [
    `${CSS_SENTINEL}${opts.layerOrderStatement === false ? '' : `${LAYER_ORDER}\n`}@layer sv.${layer} {`,
    `${selector} {`
  ];
  for (const [token, value] of theme.tokens) {
    lines.push(`  --sv-${token}: ${value};`);
  }
  lines.push('}', '}', '');
  return lines.join('\n');
};
