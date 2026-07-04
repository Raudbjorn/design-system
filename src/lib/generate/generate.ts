// generateTheme — seed colors in, WCAG-AA-guaranteed world-theme package out.
//
// Every numeric anchor below was measured from the hand-authored dark/light
// palettes (OKLCH structure + achieved contrast ratios), so generated themes
// sit in the same tonal architecture as the built-ins instead of a generic
// "accessible palette" look. Contrast targets are INPUTS to the lightness
// solver (Leonardo's core idea); the final checkThemeAA pass is a defensive
// re-verification, not the mechanism.
//
// Deterministic by construction: no randomness, no timestamps. Same options →
// byte-identical output on the same JS engine (cross-engine drift ≤1/255 via
// libm differences; gates hold because aims sit above floors).

import { hexToOklch, oklchToHex } from '../internal/color.ts';
import { contrastRatio } from '../internal/contrast.ts';
import { checkThemeAA } from '../internal/invariants.ts';
import { analyzeSeeds, assignTriad, HOUSE_TRIAD, hueDistance, shortestArc } from './assign.ts';
import type { TriadSlot } from './assign.ts';
import { foldHints } from './hints.ts';
import { solveLightness } from './solve.ts';
import type {
  GenerateOptions,
  GenerationReport,
  GenerationWarning,
  GenError,
  Mode,
  Result,
  SeedUsage,
  WorldThemePackage
} from './types.ts';

export const GENERATOR_VERSION = 1;

const MAX_SEEDS = 5;
const SEED_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const NAME_RE = /^[a-z][a-z0-9-]{0,63}$/;

// ── Measured anchors (from the hand themes; see plan §Phase 4) ───────────
const BG_L: Record<Mode, number> = { dark: 0.21, light: 0.93 };
const BG_C_CAP: Record<Mode, number> = { dark: 0.015, light: 0.05 };
const SURFACE_STEPS: Record<Mode, [number, number, number]> = {
  dark: [0.022, 0.052, 0.084],
  light: [-0.019, -0.035, -0.056]
};
const BORDER_L_STEP: Record<Mode, number> = { dark: 0.14, light: -0.14 };

const TEXT_C: Record<Mode, (bgC: number) => number> = {
  dark: (bgC) => Math.min(bgC, 0.01),
  light: (bgC) => Math.min(bgC * 0.7, 0.035)
};
const TEXT_TARGETS: Record<Mode, Record<string, number>> = {
  dark: { 'text-strong': 15.5, text: 11.5, 'text-muted': 6.2, 'text-faint': 4.6 },
  light: { 'text-strong': 12.0, text: 9.5, 'text-muted': 5.4, 'text-faint': 5.0 }
};
const TEXT_ON_SURFACE3 = new Set(['text-strong', 'text', 'text-muted']);

const ACCENT_L_BAND: Record<Mode, [number, number]> = {
  dark: [0.62, 0.82],
  light: [0.52, 0.66]
};
const ACCENT_C_RANGE: [number, number] = [0.07, 0.15];
const ACCENT_C_CAP = 0.17;
const ACCENT_AIM = 3.2;
const ACCENT_FLOOR = 3.0;

const STATUS_ANCHORS = {
  success: { h: 147, c: 0.165, cFloor: 0.1 },
  error: { h: 29, c: 0.19, cFloor: 0.13 },
  warning: { h: 68, c: 0.15, cFloor: 0.1 }
} as const;
const STATUS_L_START: Record<Mode, number> = { dark: 0.6, light: 0.575 };

const SYN_ANCHORS = {
  'syn-keyword': { h: 250, c: 0.11 },
  'syn-string': { h: 43, c: 0.083 },
  'syn-var': { h: 232, c: 0.08 },
  'syn-func': { h: 108, c: 0.066 },
  'syn-comment': { h: 137, c: 0.113 },
  'syn-number': { h: 135, c: 0.059 }
} as const;
const SYN_TARGETS: Record<Mode, Record<keyof typeof SYN_ANCHORS, number>> = {
  dark: {
    'syn-keyword': 4.7,
    'syn-string': 5.2,
    'syn-var': 9.2,
    'syn-func': 9.5,
    'syn-comment': 4.8,
    'syn-number': 8.1
  },
  light: {
    'syn-keyword': 5.9,
    'syn-string': 4.9,
    'syn-var': 6.9,
    'syn-func': 5.0,
    'syn-comment': 4.7,
    'syn-number': 5.0
  }
};
const SYN_ROTATION_LIMIT = 40;

const RADIUS_PRESETS = {
  sharp: { 'radius-sm': '0', 'radius-md': '0', 'radius-lg': '2px' },
  soft: { 'radius-sm': '6px', 'radius-md': '10px', 'radius-lg': '16px' }
} as const;

// ── helpers ──────────────────────────────────────────────────────────────
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
const norm = (h: number): number => ((h % 360) + 360) % 360;
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

const validate = (opts: GenerateOptions): GenError | null => {
  if (!Array.isArray(opts.seeds) || opts.seeds.length === 0) return { kind: 'no-seeds' };
  if (opts.seeds.length > MAX_SEEDS) {
    return { kind: 'too-many-seeds', count: opts.seeds.length, max: MAX_SEEDS };
  }
  const badIndex = opts.seeds.findIndex((s) => typeof s !== 'string' || !SEED_RE.test(s.trim()));
  if (badIndex >= 0) {
    return { kind: 'invalid-seed', seed: String(opts.seeds[badIndex]), index: badIndex };
  }
  if (typeof opts.name !== 'string' || !NAME_RE.test(opts.name)) {
    return { kind: 'invalid-name', name: String(opts.name) };
  }
  const mode = opts.mode ?? 'auto';
  if (mode !== 'auto' && mode !== 'dark' && mode !== 'light') {
    return { kind: 'invalid-mode', mode: String(mode) };
  }
  return null;
};

interface SolveTracking {
  warnings: GenerationWarning[];
}

/** Solve with clamped-chroma + missed-target reporting folded in. */
const solveTracked = (
  tracking: SolveTracking,
  token: string,
  opts: { c: number; h: number; against: string; target: number; direction: 'lighter' | 'darker' }
): string => {
  const result = solveLightness(opts);
  if (result.effectiveChroma < opts.c - 0.012) {
    tracking.warnings.push({
      kind: 'chroma-clamped',
      token,
      requested: round3(opts.c),
      effective: round3(result.effectiveChroma)
    });
  }
  if (result.achieved < opts.target - 0.15) {
    tracking.warnings.push({
      kind: 'target-missed',
      token,
      target: opts.target,
      achieved: Math.round(result.achieved * 100) / 100
    });
  }
  return result.hex;
};

/** Accent-style placement: keep the seed's character (h, c, and l when it
 * fits the band), push lightness only as far as the gate demands. */
const placeAccent = (
  tracking: SolveTracking,
  token: string,
  slot: TriadSlot,
  mode: Mode,
  chromaScale: number,
  bgHex: string
): string => {
  const c = Math.min(clamp(slot.c, ...ACCENT_C_RANGE) * chromaScale, ACCENT_C_CAP);
  const [lo, hi] = ACCENT_L_BAND[mode];
  const l = clamp(slot.l ?? (lo + hi) / 2, lo, hi);
  const direct = oklchToHex({ l, c, h: slot.h });
  if (contrastRatio(direct, bgHex) >= ACCENT_AIM) {
    const measured = hexToOklch(direct);
    if (measured && measured.c < c - 0.012) {
      tracking.warnings.push({
        kind: 'chroma-clamped',
        token,
        requested: round3(c),
        effective: round3(measured.c)
      });
    }
    return direct;
  }
  const solved = solveTracked(tracking, token, {
    c,
    h: slot.h,
    against: bgHex,
    target: ACCENT_AIM,
    direction: mode === 'dark' ? 'lighter' : 'darker'
  });
  // The solver aims at 3.2; the hard floor is 3.0 — verify, warn if between.
  const achieved = contrastRatio(solved, bgHex);
  if (achieved < ACCENT_FLOOR) {
    tracking.warnings.push({
      kind: 'target-missed',
      token,
      target: ACCENT_FLOOR,
      achieved: Math.round(achieved * 100) / 100
    });
  }
  return solved;
};

export const generateTheme = (
  opts: GenerateOptions
): Result<{ theme: WorldThemePackage; report: GenerationReport }, GenError> => {
  const invalid = validate(opts);
  if (invalid) return { ok: false, error: invalid };

  const seeds = opts.seeds.map((s) => s.trim().toLowerCase());
  const warnings: GenerationWarning[] = [];
  const tracking: SolveTracking = { warnings };

  // 1. Seeds + hints.
  const analysis = analyzeSeeds(seeds);
  warnings.push(...analysis.warnings);
  const { folded, warnings: hintWarnings } = foldHints(opts.hints ?? []);
  warnings.push(...hintWarnings);

  // 2. Mode: explicit > hint bias (auto only) > median seed lightness.
  const requested = opts.mode ?? 'auto';
  const mode: Mode =
    requested !== 'auto' ? requested : (folded.modeBias ?? (analysis.medianL <= 0.5 ? 'dark' : 'light'));
  const direction = mode === 'dark' ? 'lighter' : 'darker';

  // 3. World hue/chroma (hint hue pull applied at 30%).
  let worldHue = analysis.worldHue;
  if (folded.hueWarmPull !== null && analysis.worldChroma > 0) {
    worldHue = norm(worldHue + shortestArc(worldHue, folded.hueWarmPull) * 0.3);
  }
  const worldChroma = analysis.worldChroma;

  // 4. Neutrals.
  const palette: Record<string, string> = {};
  const bgL = clamp(BG_L[mode] + folded.bgLNudge, 0.1, 0.97);
  const bgC = Math.min(BG_C_CAP[mode], worldChroma * 0.25);
  palette.bg = oklchToHex({ l: bgL, c: bgC, h: worldHue });
  SURFACE_STEPS[mode].forEach((step, i) => {
    palette[`surface-${i + 1}`] = oklchToHex({
      l: bgL + step,
      c: bgC * (1 + 0.1 * (i + 1)),
      h: worldHue
    });
  });
  palette.border = oklchToHex({
    l: clamp(bgL + BORDER_L_STEP[mode], 0, 1),
    c: Math.min(bgC * 1.5, 0.08),
    h: worldHue
  });
  palette['mix-target'] = mode === 'dark' ? '#ffffff' : '#000000';

  // 5. Text ladder — solved against bg, re-solved against surface-3 when the
  // tinted surfaces compress the pair (monotone: pushing away from surface-3
  // also pushes away from bg).
  const textC = TEXT_C[mode](bgC);
  const surface3 = palette['surface-3']!;
  for (const [token, target] of Object.entries(TEXT_TARGETS[mode])) {
    let hex = solveTracked(tracking, token, {
      c: textC,
      h: worldHue,
      against: palette.bg!,
      target,
      direction
    });
    if (TEXT_ON_SURFACE3.has(token) && contrastRatio(hex, surface3) < 4.5) {
      hex = solveTracked(tracking, token, {
        c: textC,
        h: worldHue,
        against: surface3,
        target: 4.6,
        direction
      });
    }
    palette[token] = hex;
  }

  // 6. Accent triad.
  const triad = assignTriad(analysis);
  warnings.push(...triad.warnings);
  palette.accent = placeAccent(tracking, 'accent', triad.accent, mode, folded.chromaScale, palette.bg!);
  palette['accent-2'] = placeAccent(tracking, 'accent-2', triad.accent2, mode, folded.chromaScale, palette.bg!);
  palette['accent-rust'] = placeAccent(tracking, 'accent-rust', triad.rust, mode, folded.chromaScale, palette.bg!);

  // 7. Status — semantic hues never rotate with the world; chroma floors keep
  // them recognizable under muted moods.
  for (const [token, anchor] of Object.entries(STATUS_ANCHORS)) {
    const c = Math.max(anchor.c * folded.chromaScale, anchor.cFloor);
    const startHex = oklchToHex({ l: STATUS_L_START[mode], c, h: anchor.h });
    palette[token] =
      contrastRatio(startHex, palette.bg!) >= ACCENT_AIM
        ? startHex
        : solveTracked(tracking, token, {
            c,
            h: anchor.h,
            against: palette.bg!,
            target: ACCENT_AIM,
            direction
          });
  }

  // 8. Syntax — rigid rotation preserves every pairwise hue distance; the
  // two-tier per-role lightness targets carry distinguishability.
  const accentHue = hexToOklch(palette.accent!)?.h ?? HOUSE_TRIAD.accent;
  const delta = clamp(shortestArc(HOUSE_TRIAD.accent, accentHue), -SYN_ROTATION_LIMIT, SYN_ROTATION_LIMIT);
  const synChromaFactor = clamp(folded.chromaScale, 0.5, 1.3);
  for (const [token, anchor] of Object.entries(SYN_ANCHORS)) {
    palette[token] = solveTracked(tracking, token, {
      c: anchor.c * synChromaFactor,
      h: norm(anchor.h + delta),
      against: surface3,
      target: SYN_TARGETS[mode][token as keyof typeof SYN_ANCHORS],
      direction
    });
  }
  // Collision pass: same-tier roles that landed too close get a deterministic
  // hue separation; contrast is hard, distinguishability is soft.
  const synTokens = Object.keys(SYN_ANCHORS);
  for (let i = 0; i < synTokens.length; i++) {
    for (let j = i + 1; j < synTokens.length; j++) {
      const [a, b] = [synTokens[i]!, synTokens[j]!];
      const la = hexToOklch(palette[a]!)!;
      const lb = hexToOklch(palette[b]!)!;
      if (hueDistance(la.h, lb.h) < 20 && Math.abs(la.l - lb.l) < 0.08 && Math.abs(la.c - lb.c) < 0.04) {
        const anchor = SYN_ANCHORS[b as keyof typeof SYN_ANCHORS];
        const retried = solveTracked(tracking, b, {
          c: anchor.c * synChromaFactor,
          h: norm(anchor.h + delta + 25),
          against: surface3,
          target: SYN_TARGETS[mode][b as keyof typeof SYN_ANCHORS],
          direction
        });
        const rl = hexToOklch(retried)!;
        if (hueDistance(la.h, rl.h) >= 20 || Math.abs(la.l - rl.l) >= 0.08) {
          palette[b] = retried;
        } else {
          warnings.push({
            kind: 'hue-collision',
            tokens: [a, b],
            deltaH: Math.round(hueDistance(la.h, lb.h) * 10) / 10
          });
        }
      }
    }
  }

  // 9. Defensive final gate — the solver already guarantees these; if a pair
  // still fails (rounding at a gamut edge), desaturate toward gray, which
  // always passes for the solved lightness.
  for (let attempt = 0; attempt < 2; attempt++) {
    const failing = checkThemeAA(palette).filter((c) => !c.pass);
    if (failing.length === 0) break;
    for (const check of failing) {
      const current = hexToOklch(palette[check.fg]!)!;
      const solvedGray = solveLightness({
        c: attempt === 0 ? current.c / 2 : 0,
        h: current.h,
        against: palette[check.bg]!,
        target: check.floor + 0.1,
        direction
      });
      palette[check.fg] = solvedGray.hex;
      warnings.push({
        kind: 'chroma-clamped',
        token: check.fg,
        requested: round3(current.c),
        effective: round3(solvedGray.effectiveChroma)
      });
    }
  }

  // 10. Assemble the package (engine-shaped; parseWorldTheme ingests it).
  const tokens: Record<string, unknown> = {};
  for (const [token, value] of Object.entries(palette)) {
    tokens[token] = { $type: 'color', $value: value };
  }
  if (folded.radius) {
    for (const [token, value] of Object.entries(RADIUS_PRESETS[folded.radius])) {
      tokens[token] = { $type: 'dimension', $value: value === '0' ? '0px' : value };
    }
  }

  const meta: Record<string, string> = {
    generator: `@svnbjrn/design generate v${GENERATOR_VERSION}`,
    seeds: seeds.join(',')
  };
  if (opts.hints && opts.hints.length > 0) meta.hints = opts.hints.join(',');
  if (folded.fontStance) meta.fontStance = folded.fontStance;

  const theme: WorldThemePackage = {
    name: opts.name,
    version: '1.0.0',
    extends: mode,
    meta,
    tokens
  };

  const seedUsage: SeedUsage[] = analysis.seeds.map((seed) => ({
    seed: seed.hex,
    index: seed.index,
    role: triad.roles.get(seed.index) ?? 'atmosphere',
    oklch: {
      l: round3(seed.oklch.l),
      c: round3(seed.oklch.c),
      h: Math.round(seed.oklch.h * 10) / 10
    }
  }));

  const report: GenerationReport = {
    mode,
    seedUsage,
    checks: checkThemeAA(palette),
    warnings
  };

  return { ok: true, value: { theme, report } };
};
