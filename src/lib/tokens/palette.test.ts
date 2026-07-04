import { describe, expect, it } from 'vitest';
import { checkThemeAA } from '../internal/invariants';
import { dark, light } from './palette';

// The AA contract lives in internal/invariants.ts (CONTRAST_RULES) so the
// runtime theme gate and the generator enforce exactly what the built-in
// themes are held to. This test is the self-consistency proof: both
// hand-authored themes pass every rule — including the "extension" tier —
// which is also what guarantees the runtime gate's revert-to-built-in
// fallback always terminates in a passing palette.

describe('palette accessibility', () => {
  for (const [name, palette] of [
    ['dark', dark],
    ['light', light]
  ] as const) {
    it(`${name} passes every contrast rule`, () => {
      const failures = checkThemeAA(palette)
        .filter((c) => !c.pass)
        .map((c) => `${c.fg} on ${c.bg}: ${c.ratio.toFixed(2)} < ${c.floor} (${c.tier})`);
      expect(failures).toEqual([]);
    });
  }

  it('dark and light define the same token keys', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });
});
