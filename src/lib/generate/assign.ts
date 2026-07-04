// Seed analysis and accent-triad role assignment.
//
// Measured relationships from the hand-authored themes anchor everything:
// the accent triad sits at hues 177/17/43 in BOTH modes, accent-2 is
// near-complementary to accent, and rust is a warm low-chroma sibling of
// accent-2 (+26°, C×0.57). Generation preserves seed character (hue and
// chroma) and only pushes lightness to the contrast gate.

import { hexToOklch } from '../internal/color.ts';
import type { Oklch } from '../internal/color.ts';
import type { GenerationWarning, SeedRole } from './types.ts';

export const CHROMATIC_MIN_C = 0.03;
export const HOUSE_TRIAD = { accent: 177.2, accent2: 17, rust: 43 } as const;

export interface SeedInfo {
  hex: string;
  index: number;
  oklch: Oklch;
  chromatic: boolean;
}

export interface SeedAnalysis {
  seeds: SeedInfo[];
  chromatic: SeedInfo[];
  /** Chroma-weighted circular mean of chromatic seed hues; house accent hue
   * when no seed is chromatic. */
  worldHue: number;
  /** Mean chroma of chromatic seeds (0 when none). */
  worldChroma: number;
  /** Lower-median lightness across all seeds. */
  medianL: number;
  warnings: GenerationWarning[];
}

export const hueDistance = (a: number, b: number): number => {
  const d = Math.abs(((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
};

/** Signed shortest arc from `a` to `b` in (-180, 180]. */
export const shortestArc = (a: number, b: number): number => {
  const d = (((b - a) % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
};

const norm = (h: number): number => ((h % 360) + 360) % 360;

export const analyzeSeeds = (hexes: readonly string[]): SeedAnalysis => {
  const warnings: GenerationWarning[] = [];
  const seeds: SeedInfo[] = hexes.map((hex, index) => {
    const oklch = hexToOklch(hex);
    if (!oklch) throw new TypeError(`analyzeSeeds: unparseable seed "${hex}" (validate first)`);
    if (oklch.l < 0.1 || oklch.l > 0.95) {
      warnings.push({ kind: 'extreme-seed-lightness', seed: hex, l: Math.round(oklch.l * 1000) / 1000 });
    }
    return { hex, index, oklch, chromatic: oklch.c >= CHROMATIC_MIN_C };
  });

  const chromatic = seeds.filter((s) => s.chromatic);
  if (chromatic.length === 0) warnings.push({ kind: 'achromatic-seeds' });

  let worldHue: number = HOUSE_TRIAD.accent;
  if (chromatic.length > 0) {
    let x = 0;
    let y = 0;
    for (const seed of chromatic) {
      const rad = (seed.oklch.h * Math.PI) / 180;
      x += seed.oklch.c * Math.cos(rad);
      y += seed.oklch.c * Math.sin(rad);
    }
    worldHue = norm((Math.atan2(y, x) * 180) / Math.PI);
  }
  const worldChroma =
    chromatic.length === 0
      ? 0
      : chromatic.reduce((sum, s) => sum + s.oklch.c, 0) / chromatic.length;

  const ls = seeds.map((s) => s.oklch.l).sort((a, b) => a - b);
  const medianL = ls[Math.floor((ls.length - 1) / 2)] ?? 0.5;

  return { seeds, chromatic, worldHue, worldChroma, medianL, warnings };
};

export interface TriadSlot {
  h: number;
  c: number;
  /** Seed lightness carried into the L band clamp; null = mode default. */
  l: number | null;
  seedIndex: number | null;
}

export interface TriadAssignment {
  accent: TriadSlot;
  accent2: TriadSlot;
  rust: TriadSlot;
  roles: Map<number, SeedRole>;
  warnings: GenerationWarning[];
}

const MIN_ACCENT2_SEPARATION = 50;
const MIN_RUST_SEPARATION = 40;
const WARM_POLE = 25;

/** Fill the accent triad. The FIRST chromatic seed owns the accent slot —
 * extraction pipelines order seeds by dominance (K-Means cluster size), and
 * the hand theme itself picks its accent by prominence, not peak chroma
 * (house teal is out-chroma'd by house coral). Remaining slots rank by
 * chroma; missing slots synthesize from the measured house relationships. */
export const assignTriad = (analysis: SeedAnalysis): TriadAssignment => {
  const warnings: GenerationWarning[] = [];
  const roles = new Map<number, SeedRole>();
  const [first, ...others] = analysis.chromatic;
  const ranked = first
    ? [first, ...others.sort((a, b) => b.oklch.c - a.oklch.c || a.index - b.index)]
    : [];

  const top = ranked[0];
  const accent: TriadSlot = top
    ? { h: top.oklch.h, c: top.oklch.c, l: top.oklch.l, seedIndex: top.index }
    : { h: HOUSE_TRIAD.accent, c: 0.08, l: null, seedIndex: null };
  if (top) roles.set(top.index, 'accent');

  const rest = ranked.slice(1);
  const byDistance = (from: number) =>
    [...rest].sort(
      (a, b) => hueDistance(b.oklch.h, from) - hueDistance(a.oklch.h, from) || a.index - b.index
    );

  let accent2: TriadSlot;
  const a2Candidate = byDistance(accent.h).find(
    (s) => !roles.has(s.index) && hueDistance(s.oklch.h, accent.h) >= MIN_ACCENT2_SEPARATION
  );
  if (a2Candidate) {
    accent2 = {
      h: a2Candidate.oklch.h,
      c: a2Candidate.oklch.c,
      l: a2Candidate.oklch.l,
      seedIndex: a2Candidate.index
    };
    roles.set(a2Candidate.index, 'accent-2');
  } else {
    // Complement, rotated up to ±15° toward the warm pole.
    const complement = norm(accent.h + 180);
    const pull = shortestArc(complement, WARM_POLE);
    const h = norm(complement + Math.sign(pull) * Math.min(15, Math.abs(pull)));
    accent2 = { h, c: Math.max(accent.c * 0.9, 0.09), l: null, seedIndex: null };
  }

  let rust: TriadSlot;
  const rustCandidate = rest.find(
    (s) =>
      !roles.has(s.index) &&
      hueDistance(s.oklch.h, accent.h) >= MIN_RUST_SEPARATION &&
      hueDistance(s.oklch.h, accent2.h) >= MIN_RUST_SEPARATION
  );
  if (rustCandidate) {
    rust = {
      h: rustCandidate.oklch.h,
      c: rustCandidate.oklch.c,
      l: rustCandidate.oklch.l,
      seedIndex: rustCandidate.index
    };
    roles.set(rustCandidate.index, 'accent-rust');
  } else {
    // The measured hand relationship: accent-2's warm sibling.
    rust = { h: norm(accent2.h + 26), c: accent2.c * 0.6, l: null, seedIndex: null };
  }

  for (const seed of analysis.seeds) {
    if (roles.has(seed.index)) continue;
    roles.set(seed.index, 'atmosphere');
    if (seed.chromatic) {
      warnings.push({
        kind: 'seed-unused',
        seed: seed.hex,
        index: seed.index,
        reason: 'no accent slot available (hue too close to an assigned accent)'
      });
    }
  }

  return { accent, accent2, rust, roles, warnings };
};
