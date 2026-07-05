// The closed contract of themeable UI strings — which dotted keys a catalog
// may set, and each slot's placeholder signature, length budget, and English
// default. Mirrors SV_TOKEN_REGISTRY. registry.test.ts pins every plainDefault
// to the component's actual rendered default (lockstep).

export interface VernacularSpec {
  /** Component group, maps back to the nested Vernacular shape. */
  component: 'codeBlock' | 'navBar';
  /** Prop name on that component. */
  prop: string;
  /** Required {name} placeholder set; [] for all current fixed-label keys. */
  placeholders: readonly string[];
  /** Code-point cap for this UI slot. */
  maxLen: number;
  /** The English default — single source for the fallback + plain-language paths. */
  plainDefault: string;
}

// Keys are dotted `component.prop`, 1:1 with the leaves of the Vernacular type.
export const VERNACULAR_REGISTRY: ReadonlyMap<string, VernacularSpec> = new Map([
  ['codeBlock.copyLabel', { component: 'codeBlock', prop: 'copyLabel', placeholders: [], maxLen: 24, plainDefault: 'Copy' }],
  ['codeBlock.copiedLabel', { component: 'codeBlock', prop: 'copiedLabel', placeholders: [], maxLen: 24, plainDefault: 'Copied' }],
  ['codeBlock.copyAriaLabel', { component: 'codeBlock', prop: 'copyAriaLabel', placeholders: [], maxLen: 48, plainDefault: 'Copy code' }],
  ['navBar.navLabel', { component: 'navBar', prop: 'navLabel', placeholders: [], maxLen: 32, plainDefault: 'Primary' }],
  ['navBar.menuLabel', { component: 'navBar', prop: 'menuLabel', placeholders: [], maxLen: 32, plainDefault: 'Menu' }]
]);
