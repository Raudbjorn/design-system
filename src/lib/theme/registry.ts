// What a world theme is allowed to touch, and with which value grammar.
//
// The registry is the closed, total contract: every overridable --sv-* token
// with its $type; z-index and breakpoints are hard-locked (worlds restyle
// color, type and shape — never stacking contexts or layout thresholds).
// registry.test.ts asserts this list stays in lockstep with the DTCG sources.

import { palettes } from '../tokens/palette.ts';
import type { TokenType } from '../tokens/resolver.ts';

export { CONTRAST_RULES } from '../internal/invariants.ts';
export type { ContrastRule, ContrastCheck } from '../internal/invariants.ts';

export interface TokenSpec {
  type: TokenType;
  /** Hard-locked: a world package can never override this token. */
  locked: boolean;
  /** May the value carry alpha? Semantic colors: no (WCAG ratios are
   * undefined against an unknown backdrop); shadow colors: yes (inside the
   * shadow grammar, not here). */
  alphaAllowed: boolean;
}

const spec = (type: TokenType, locked = false, alphaAllowed = false): TokenSpec => ({
  type,
  locked,
  alphaAllowed
});

const entries: Array<[string, TokenSpec]> = [];

// Semantic color tokens — from the generated palette, so a token added to the
// DTCG source is automatically registered.
for (const name of Object.keys(palettes.dark)) {
  entries.push([name, spec('color')]);
}

// Themeable scale tokens.
for (const name of ['radius-sm', 'radius-md', 'radius-lg']) {
  entries.push([name, spec('dimension')]);
}
entries.push(['font-sans', spec('fontFamily')], ['font-mono', spec('fontFamily')]);
for (const name of ['normal', 'medium', 'semibold', 'bold']) {
  entries.push([`font-weight-${name}`, spec('fontWeight')]);
}
for (const name of ['0', '1', '2', '3', '4', '6', '8', '12']) {
  entries.push([`space-${name}`, spec('dimension')]);
}
for (const name of ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl']) {
  entries.push([`fs-${name}`, spec('dimension')]);
}
for (const name of ['tight', 'normal', 'relaxed']) {
  entries.push([`lh-${name}`, spec('number')]);
}
entries.push(['shadow-sm', spec('shadow')], ['shadow-md', spec('shadow')]);

// Locked: never world-themeable.
for (const name of ['base', 'elevated', 'sticky', 'dropdown', 'overlay']) {
  entries.push([`z-${name}`, spec('number', true)]);
}
for (const name of ['sm', 'md', 'lg']) {
  entries.push([`bp-${name}`, spec('dimension', true)]);
}

export const SV_TOKEN_REGISTRY: ReadonlyMap<string, TokenSpec> = new Map(entries);
