import { describe, expect, it } from 'vitest';
import { converter, formatHex, interpolate } from 'culori';
import {
  clampChromaToGamut,
  hexToOklch,
  mixOklab,
  oklchToHex,
  parseColor,
  toHex6,
  toHex8
} from './color';

// Deterministic LCG so the property corpus is stable across runs.
const lcg = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const randomHexes = (count: number, seed = 0xc0ffee): string[] => {
  const next = lcg(seed);
  return Array.from({ length: count }, () =>
    toHex6({
      r: Math.floor(next() * 256),
      g: Math.floor(next() * 256),
      b: Math.floor(next() * 256)
    })
  );
};

const toCuloriOklch = converter('oklch');

describe('hex round-trip', () => {
  it('hex → oklch → hex is byte-exact across 5000 seeded colors', () => {
    for (const hex of randomHexes(5000)) {
      const lch = hexToOklch(hex);
      expect(lch).not.toBeNull();
      expect(oklchToHex(lch!)).toBe(hex);
    }
  });

  it('matches the measured anchors from the hand-authored palettes', () => {
    const paper = hexToOklch('#f1e7c4')!;
    expect(paper.l).toBeCloseTo(0.927, 2);
    expect(paper.c).toBeCloseTo(0.047, 2);
    expect(paper.h).toBeCloseTo(94, 0);

    const teal = hexToOklch('#4ec9b0')!;
    expect(teal.l).toBeCloseTo(0.7604, 2);
    expect(teal.c).toBeCloseTo(0.1152, 2);
    expect(teal.h).toBeCloseTo(177.2, 0);
  });
});

describe('culori oracle', () => {
  it('rgb → oklch agrees with culori within 2e-3 across 1000 colors', () => {
    for (const hex of randomHexes(1000, 0xdead)) {
      const ours = hexToOklch(hex)!;
      const theirs = toCuloriOklch(hex)!;
      expect(ours.l).toBeCloseTo(theirs.l, 3);
      expect(ours.c).toBeCloseTo(theirs.c, 3);
      // Hue is meaningless at near-zero chroma; culori reports undefined there.
      if (theirs.h !== undefined && ours.c > 0.005) {
        const dh = Math.abs(((ours.h - theirs.h + 540) % 360) - 180);
        expect(dh).toBeLessThan(0.5);
      }
    }
  });

  it('oklch → hex agrees with culori for in-gamut colors', () => {
    for (const hex of randomHexes(500, 0xbeef)) {
      const lch = hexToOklch(hex)!;
      const theirs = formatHex({ mode: 'oklch', l: lch.l, c: lch.c, h: lch.h });
      expect(oklchToHex(lch)).toBe(theirs);
    }
  });
});

describe('gamut clamping', () => {
  it('clamps out-of-gamut chroma while preserving lightness and hue', () => {
    const wild = { l: 0.5, c: 0.4, h: 145 };
    const clamped = clampChromaToGamut(wild);
    expect(clamped.c).toBeLessThan(0.4);
    expect(clamped.l).toBe(0.5);
    expect(clamped.h).toBe(145);
    // The rendered result should measure back near the requested l/h.
    const measured = hexToOklch(oklchToHex(wild))!;
    expect(measured.l).toBeCloseTo(0.5, 2);
    expect(Math.abs(((measured.h - 145 + 540) % 360) - 180)).toBeLessThan(1.5);
  });

  it('handles achromatic and out-of-range lightness', () => {
    expect(oklchToHex({ l: 0, c: 0, h: 0 })).toBe('#000000');
    expect(oklchToHex({ l: 1, c: 0, h: 0 })).toBe('#ffffff');
    expect(oklchToHex({ l: 1.2, c: 0.1, h: 30 })).toBe('#ffffff');
    expect(oklchToHex({ l: -0.2, c: 0.1, h: 30 })).toBe('#000000');
  });
});

describe('parseColor', () => {
  it('accepts the supported subset', () => {
    expect(parseColor('#4ec9b0')).toEqual({ r: 0x4e, g: 0xc9, b: 0xb0, a: 1 });
    expect(parseColor('#FFF')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('#0008')).toEqual({ r: 0, g: 0, b: 0, a: 0x88 / 255 });
    expect(parseColor('#11223344')).toEqual({ r: 0x11, g: 0x22, b: 0x33, a: 0x44 / 255 });
    expect(parseColor('rgb(78, 201, 176)')).toEqual({ r: 78, g: 201, b: 176, a: 1 });
    expect(parseColor('rgba(78, 201, 176, 0.5)')).toEqual({ r: 78, g: 201, b: 176, a: 0.5 });
    expect(parseColor('rgb(78 201 176 / 50%)')).toEqual({ r: 78, g: 201, b: 176, a: 0.5 });
    expect(parseColor('rgb(10% 20% 30%)')).toEqual({ r: 26, g: 51, b: 77, a: 1 });
    expect(parseColor('rgb(300, -5, 12)')).toEqual({ r: 255, g: 0, b: 12, a: 1 });
    expect(parseColor('oklch(0.7604 0.1152 177.2)')).toEqual({ r: 0x4e, g: 0xc9, b: 0xb0, a: 1 });
    expect(parseColor('oklch(76.04% 0.1152 177.2deg / 25%)')).toEqual({
      r: 0x4e,
      g: 0xc9,
      b: 0xb0,
      a: 0.25
    });
  });

  it('rejects everything outside the subset', () => {
    const rejected = [
      '',
      'red',
      'transparent',
      'currentColor',
      'var(--sv-accent)',
      'color-mix(in oklab, red, blue)',
      'url(javascript:alert(1))',
      'hsl(120 50% 50%)',
      '#12345g',
      '#12345',
      'rgb(1,2)',
      'rgb(1,2,3,4,5)',
      'rgb(1e3, 0, 0)',
      'rgb(calc(1+2), 0, 0)',
      'oklch(0.5 0.1)',
      'oklch(0.5 0.1 30 / 1 / 2)',
      'oklch(50deg 0.1 30)',
      `#${'f'.repeat(70)}`,
      'rgb(1 2 3'
    ];
    for (const input of rejected) {
      expect(parseColor(input), `should reject: ${input}`).toBeNull();
    }
  });
});

describe('mixOklab', () => {
  it('is the identity at weight 0 and the other endpoint at weight 1', () => {
    expect(mixOklab('#191919', '#ffffff', 0)).toBe('#191919');
    expect(mixOklab('#191919', '#ffffff', 1)).toBe('#ffffff');
  });

  it('agrees with culori oklab interpolation within 1/255 per channel', () => {
    const cases: Array<[string, string, number]> = [
      ['#4ec9b0', '#ffffff', 0.15],
      ['#e06c75', '#ffffff', 0.15],
      ['#f44430', '#ffffff', 0.25],
      ['#2b8a77', '#000000', 0.15],
      ['#252526', '#ffffff', 0.15],
      ['#e6dcb2', '#000000', 0.25],
      ['#191919', '#ffffff', 0.5]
    ];
    for (const [a, b, w] of cases) {
      const ours = parseColor(mixOklab(a, b, w))!;
      const theirs = parseColor(formatHex(interpolate([a, b], 'oklab')(w)))!;
      expect(Math.abs(ours.r - theirs.r), `${a}+${b}@${w} r`).toBeLessThanOrEqual(1);
      expect(Math.abs(ours.g - theirs.g), `${a}+${b}@${w} g`).toBeLessThanOrEqual(1);
      expect(Math.abs(ours.b - theirs.b), `${a}+${b}@${w} b`).toBeLessThanOrEqual(1);
    }
  });

  it('throws on unparseable input (programmer error, not user data)', () => {
    expect(() => mixOklab('nope', '#fff', 0.5)).toThrow(TypeError);
    expect(() => mixOklab('#fff', 'var(--x)', 0.5)).toThrow(TypeError);
  });
});

describe('hex serialization', () => {
  it('toHex8 encodes alpha', () => {
    expect(toHex8({ r: 0, g: 0, b: 0, a: 0.35 })).toBe('#00000059');
    expect(toHex8({ r: 255, g: 255, b: 255, a: 1 })).toBe('#ffffffff');
  });
});
