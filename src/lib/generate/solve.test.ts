import { describe, expect, it } from 'vitest';
import { solveLightness } from './solve';
import { hexToOklch, oklchToHex } from '../internal/color';
import { contrastRatio } from '../internal/contrast';

describe('solveLightness', () => {
  it('meets the target with minimal push away from the background', () => {
    const result = solveLightness({
      c: 0.01,
      h: 94,
      against: '#191919',
      target: 11.5,
      direction: 'lighter'
    });
    expect(result.achieved).toBeGreaterThanOrEqual(11.5);
    // Minimality: nudging one 8-bit step back toward the background drops
    // below the target — the solver didn't overshoot further than needed.
    const l = hexToOklch(result.hex)!.l;
    const oneStepDarker = oklchToHex({ l: l - 1 / 255, c: 0.01, h: 94 });
    expect(contrastRatio(oneStepDarker, '#191919')).toBeLessThan(11.5);
  });

  it('reproduces the hand text ladder within a couple of 8-bit steps', () => {
    // dark text #d4d4d4 measures 11.86:1 on #191919; solving at its measured
    // targets should land in the same neighborhood.
    const text = solveLightness({
      c: 0,
      h: 0,
      against: '#191919',
      target: 11.5,
      direction: 'lighter'
    });
    const rgb = hexToOklch(text.hex)!;
    const hand = hexToOklch('#d4d4d4')!;
    expect(Math.abs(rgb.l - hand.l)).toBeLessThan(0.02);
  });

  it('reports unreachable targets via achieved < target at the extreme', () => {
    // A saturated mid yellow cannot reach 15:1 against white.
    const result = solveLightness({
      c: 0.2,
      h: 100,
      against: '#ffffff',
      target: 15,
      direction: 'lighter'
    });
    expect(result.achieved).toBeLessThan(15);
  });

  it('reports effective chroma after gamut clamping', () => {
    const result = solveLightness({
      c: 0.4,
      h: 145,
      against: '#191919',
      target: 4.5,
      direction: 'lighter'
    });
    expect(result.effectiveChroma).toBeLessThan(0.4);
    expect(result.achieved).toBeGreaterThanOrEqual(4.5);
  });

  it('solves darker directions symmetrically', () => {
    const result = solveLightness({
      c: 0.03,
      h: 94,
      against: '#f1e7c4',
      target: 9.5,
      direction: 'darker'
    });
    expect(result.achieved).toBeGreaterThanOrEqual(9.5);
    expect(hexToOklch(result.hex)!.l).toBeLessThan(0.5);
  });

  it('is deterministic', () => {
    const opts = { c: 0.08, h: 200, against: '#141210', target: 4.5, direction: 'lighter' } as const;
    expect(solveLightness(opts)).toEqual(solveLightness(opts));
  });
});
