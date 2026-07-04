import { describe, expect, it } from 'vitest';
import { parseWorldTheme } from './parse';
import { worldThemeToCss, CSS_SENTINEL } from './css';
import type { WorldTheme } from './types';
import grimdark from './fixtures/grimdark.json';

const theme = ((): WorldTheme => {
  const parsed = parseWorldTheme(grimdark);
  if (!parsed.ok) throw new Error('fixture must parse');
  return parsed.value;
})();

describe('worldThemeToCss', () => {
  it('emits the sentinel, layer-order statement, layer block, and declarations', () => {
    const css = worldThemeToCss(theme);
    expect(css.startsWith(`${CSS_SENTINEL}@layer sv.base, sv.theme, sv.world, sv.user;`)).toBe(true);
    expect(css).toContain('@layer sv.world {');
    expect(css).toContain(':root {');
    expect(css).toContain('--sv-bg: #141210;');
    expect(css).toContain('--sv-accent-rust: #b5473a;');
    expect(css).toContain("--sv-font-sans: 'Alegreya', 'Georgia', serif;");
    expect(css).toContain('--sv-radius-lg: 6px;');
  });

  it('supports scoped selectors, the user layer, and omitting the order statement', () => {
    const css = worldThemeToCss(theme, {
      selector: '[data-sv-world="w7"]',
      layer: 'user',
      layerOrderStatement: false
    });
    expect(css.startsWith(`${CSS_SENTINEL}@layer sv.user {`)).toBe(true);
    expect(css).toContain('[data-sv-world="w7"] {');
    expect(css).not.toContain('sv.base,');
  });

  it('throws on structure-breaking selectors (programmer error)', () => {
    expect(() => worldThemeToCss(theme, { selector: ':root{}' })).toThrow(TypeError);
    expect(() => worldThemeToCss(theme, { selector: 'x</style>' })).toThrow(TypeError);
  });

  it('output stays in the printable-ASCII safe set for hostile-looking (but valid) inputs', () => {
    // Values have all been through the grammars; the property here is that
    // nothing in the assembled sheet can terminate the style context.
    const css = worldThemeToCss(theme);
    expect(css).toMatch(/^[\x20-\x7e\n]*$/);
    for (const forbidden of ['url(', '@import', '<', '\\']) {
      expect(css, `must not contain ${forbidden}`).not.toContain(forbidden);
    }
  });
});
