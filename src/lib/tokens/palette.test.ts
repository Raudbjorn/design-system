import { describe, expect, it } from 'vitest';
import { checkThemeAA } from '../internal/invariants';
import { contrastRatio } from '../internal/contrast';
import { amber, dark, light, palettes } from './palette';

// The shared runtime contract lives in internal/invariants.ts. Built-in themes
// pass every shared rule and keep semantic text at 4.5:1 on their primary
// background; the light palette additionally guarantees that floor across its
// full paper surface ramp. The published v1 theme-package contract remains 3:1
// for backwards compatibility.

const SEMANTIC_TEXT_TOKENS = [
  'accent',
  'accent-2',
  'accent-rust',
  'success',
  'error',
  'warning',
  'info'
] as const;
const LIGHT_TEXT_SURFACES = ['bg', 'surface-1', 'surface-2', 'surface-3'] as const;

describe('palette accessibility', () => {
  for (const [name, palette] of Object.entries(palettes)) {
    it(`${name} passes every contrast rule`, () => {
      const failures = checkThemeAA(palette)
        .filter((c) => !c.pass)
        .map((c) => `${c.fg} on ${c.bg}: ${c.ratio.toFixed(2)} < ${c.floor} (${c.tier})`);
      expect(failures).toEqual([]);
    });
  }

  for (const [name, palette] of Object.entries({ dark, amber })) {
    it(`${name} semantic text colors clear 4.5:1 on the primary background`, () => {
      const failures = SEMANTIC_TEXT_TOKENS.map((fg) => ({
        fg,
        ratio: contrastRatio(palette[fg]!, palette.bg!)
      }))
        .filter(({ ratio }) => ratio < 4.5)
        .map(({ fg, ratio }) => `${fg} on bg: ${ratio.toFixed(2)} < 4.5`);

      expect(failures).toEqual([]);
    });
  }

  it('light semantic text colors clear 4.5:1 on every permitted surface', () => {
    const failures = SEMANTIC_TEXT_TOKENS.flatMap((fg) =>
      LIGHT_TEXT_SURFACES.map((bg) => ({
        fg,
        bg,
        ratio: contrastRatio(light[fg]!, light[bg]!)
      }))
    )
      .filter(({ ratio }) => ratio < 4.5)
      .map(({ fg, bg, ratio }) => `${fg} on ${bg}: ${ratio.toFixed(2)} < 4.5`);

    expect(failures).toEqual([]);
  });

  it('every palette defines the same token keys as dark', () => {
    const darkKeys = Object.keys(dark).sort();
    for (const [name, palette] of Object.entries(palettes)) {
      expect(Object.keys(palette).sort(), name).toEqual(darkKeys);
    }
  });
});
