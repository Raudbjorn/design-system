import { describe, expect, it } from 'vitest';
import { generateTheme, GENERATOR_VERSION } from './index';
import { checkThemeAA } from '../internal/invariants';
import { hexToOklch, toHex6 } from '../internal/color';
import { palettes } from '../tokens/palette';
import { parseWorldTheme } from '../theme/index';

const SEMANTIC_KEYS = Object.keys(palettes.dark).sort();

const paletteOf = (theme: { tokens: Record<string, unknown> }): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme.tokens)) {
    const token = value as { $type: string; $value: string };
    if (token.$type === 'color') out[key] = token.$value;
  }
  return out;
};

// Deterministic corpus.
const lcg = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

describe('property corpus', () => {
  const next = lcg(0x5eed);
  const HINT_POOL = ['grimdark', 'neon', 'cyberpunk', 'pastel', 'noir', 'vintage', 'airy'];
  const cases = Array.from({ length: 300 }, (_, i) => {
    const seedCount = 1 + Math.floor(next() * 5);
    const seeds = Array.from({ length: seedCount }, () =>
      toHex6({
        r: Math.floor(next() * 256),
        g: Math.floor(next() * 256),
        b: Math.floor(next() * 256)
      })
    );
    const mode = (['auto', 'dark', 'light'] as const)[Math.floor(next() * 3)]!;
    const hints = HINT_POOL.filter(() => next() < 0.2);
    return { seeds, mode, hints, name: `world-${i}` };
  });

  it('every case yields a valid, complete, AA-passing theme', () => {
    for (const options of cases) {
      const result = generateTheme(options);
      expect(result.ok, JSON.stringify(options)).toBe(true);
      if (!result.ok) continue;
      const palette = paletteOf(result.value.theme);
      expect(Object.keys(palette).sort(), JSON.stringify(options)).toEqual(SEMANTIC_KEYS);
      for (const value of Object.values(palette)) {
        expect(value).toMatch(/^#[0-9a-f]{6}$/);
      }
      const failing = checkThemeAA(palette).filter((c) => !c.pass);
      expect(failing, `${JSON.stringify(options)} → ${JSON.stringify(failing)}`).toEqual([]);
      expect(result.value.report.checks.every((c) => c.pass)).toBe(true);
    }
  });

  it('generated packages pass the runtime engine gate untouched', () => {
    for (const options of cases.slice(0, 40)) {
      const generated = generateTheme(options);
      if (!generated.ok) continue;
      const parsed = parseWorldTheme(generated.value.theme);
      expect(parsed.ok, JSON.stringify(options)).toBe(true);
      if (!parsed.ok) continue;
      const reverted = parsed.value.issues.filter((i) => i.code === 'W_CONTRAST_REVERTED');
      expect(reverted, JSON.stringify(options)).toEqual([]);
    }
  });
});

describe('determinism', () => {
  it('same options → byte-identical output', () => {
    const options = { seeds: ['#c9a227', '#b5473a', '#4a6b8a'], name: 'det', hints: ['grimdark'] };
    const a = generateTheme(options);
    const b = generateTheme(options);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('mode selection', () => {
  it('auto follows median seed lightness; hints bias only auto; explicit wins', () => {
    const darkSeeds = ['#1a2b3c', '#402015'];
    const lightSeeds = ['#f1e7c4', '#dfe8f0'];
    const autoDark = generateTheme({ seeds: darkSeeds, name: 'a' });
    const autoLight = generateTheme({ seeds: lightSeeds, name: 'b' });
    const hintBiased = generateTheme({ seeds: lightSeeds, name: 'c', hints: ['noir'] });
    const explicit = generateTheme({ seeds: darkSeeds, name: 'd', mode: 'light', hints: ['noir'] });
    expect(autoDark.ok && autoDark.value.report.mode).toBe('dark');
    expect(autoLight.ok && autoLight.value.report.mode).toBe('light');
    expect(hintBiased.ok && hintBiased.value.report.mode).toBe('dark');
    expect(explicit.ok && explicit.value.report.mode).toBe('light');
  });
});

describe('fixture: house seeds reproduce the house architecture', () => {
  it('dark triad seeds land near the hand theme structure', () => {
    const result = generateTheme({
      seeds: ['#4ec9b0', '#e06c75', '#ce9178'],
      name: 'house',
      mode: 'dark'
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const palette = paletteOf(result.value.theme);
    const bg = hexToOklch(palette.bg!)!;
    const handBg = hexToOklch('#191919')!;
    expect(Math.abs(bg.l - handBg.l)).toBeLessThan(0.02);
    const accent = hexToOklch(palette.accent!)!;
    const teal = hexToOklch('#4ec9b0')!;
    const dh = Math.abs(((accent.h - teal.h + 540) % 360) - 180);
    expect(dh).toBeLessThan(10);
    // teal is the first chromatic seed (dominance order) → accent role;
    // it is not the highest-chroma seed (coral out-chromas it — see assign.ts)
    const roles = Object.fromEntries(result.value.report.seedUsage.map((s) => [s.seed, s.role]));
    expect(roles['#4ec9b0']).toBe('accent');
  });
});

describe('degenerate inputs always produce valid themes', () => {
  const degenerates: Array<{ label: string; seeds: string[]; expectWarn: string }> = [
    { label: 'single seed', seeds: ['#c9a227'], expectWarn: '' },
    { label: 'all gray', seeds: ['#808080', '#4a4a4a'], expectWarn: 'achromatic-seeds' },
    { label: 'near black', seeds: ['#010203'], expectWarn: 'extreme-seed-lightness' },
    { label: 'near white', seeds: ['#fefefe'], expectWarn: 'extreme-seed-lightness' },
    { label: 'duplicate hues', seeds: ['#c9a227', '#c9a020', '#c99a20'], expectWarn: 'seed-unused' }
  ];
  for (const { label, seeds, expectWarn } of degenerates) {
    it(label, () => {
      const result = generateTheme({ seeds, name: 'degenerate' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const failing = checkThemeAA(paletteOf(result.value.theme)).filter((c) => !c.pass);
      expect(failing).toEqual([]);
      if (expectWarn) {
        expect(result.value.report.warnings.map((w) => w.kind)).toContain(expectWarn);
      }
    });
  }
});

describe('input validation (GenError)', () => {
  it('reports each error kind', () => {
    const noSeeds = generateTheme({ seeds: [], name: 'x' });
    expect(!noSeeds.ok && noSeeds.error.kind).toBe('no-seeds');
    const tooMany = generateTheme({ seeds: Array(6).fill('#ffffff'), name: 'x' });
    expect(!tooMany.ok && tooMany.error.kind).toBe('too-many-seeds');
    const badSeed = generateTheme({ seeds: ['#ffffff', 'red'], name: 'x' });
    expect(!badSeed.ok && badSeed.error).toMatchObject({ kind: 'invalid-seed', index: 1 });
    const badName = generateTheme({ seeds: ['#ffffff'], name: 'Bad Name' });
    expect(!badName.ok && badName.error.kind).toBe('invalid-name');
    const badMode = generateTheme({ seeds: ['#ffffff'], name: 'x', mode: 'sepia' as never });
    expect(!badMode.ok && badMode.error.kind).toBe('invalid-mode');
  });
});

describe('syntax palette structure', () => {
  it('preserves the two-tier lightness structure with no unwarned collisions', () => {
    const result = generateTheme({ seeds: ['#8a4b2f', '#2f6f8a'], name: 'syn', mode: 'dark' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const palette = paletteOf(result.value.theme);
    const syn = Object.entries(palette)
      .filter(([k]) => k.startsWith('syn-'))
      .map(([k, v]) => ({ token: k, ...hexToOklch(v)! }));
    const warned = new Set(
      result.value.report.warnings
        .filter((w) => w.kind === 'hue-collision')
        .flatMap((w) => (w.kind === 'hue-collision' ? w.tokens : []))
    );
    for (let i = 0; i < syn.length; i++) {
      for (let j = i + 1; j < syn.length; j++) {
        const a = syn[i]!;
        const b = syn[j]!;
        const dh = Math.abs(((a.h - b.h + 540) % 360) - 180);
        const collides = dh < 20 && Math.abs(a.l - b.l) < 0.08 && Math.abs(a.c - b.c) < 0.04;
        if (collides) {
          expect(warned.has(a.token) || warned.has(b.token), `${a.token}/${b.token}`).toBe(true);
        }
      }
    }
  });
});

describe('hints', () => {
  it('cyberpunk emits radius overrides and a fontStance advisory; unknown hints warn', () => {
    const result = generateTheme({
      seeds: ['#00e5ff'],
      name: 'cyber',
      hints: ['cyberpunk', 'sparkly']
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.theme.tokens['radius-sm']).toEqual({ $type: 'dimension', $value: '0px' });
    expect(result.value.theme.tokens['radius-lg']).toEqual({ $type: 'dimension', $value: '2px' });
    expect(result.value.theme.meta?.fontStance).toBe('mono');
    expect(result.value.report.warnings).toContainEqual({ kind: 'unknown-hint', hint: 'sparkly' });
  });

  it('conflicting mode-bias hints warn and never break gates', () => {
    const result = generateTheme({
      seeds: ['#c9a227'],
      name: 'conflict',
      hints: ['noir', 'airy']
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.report.warnings.some((w) => w.kind === 'hint-conflict')).toBe(true);
    expect(result.value.report.checks.every((c) => c.pass)).toBe(true);
  });

  it('records generator provenance in meta', () => {
    const result = generateTheme({ seeds: ['#c9a227'], name: 'prov' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.theme.meta?.generator).toContain(`v${GENERATOR_VERSION}`);
    expect(result.value.theme.meta?.seeds).toBe('#c9a227');
  });
});
