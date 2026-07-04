// Atmosphere-hint ontology: keyword → pre-solve aesthetic adjustments.
// Hints tune mood BEFORE the solvers run; they can never break a contrast
// gate because gates are solved afterward. Multipliers compose; enums are
// last-wins with a conflict warning; unknown hints warn and are skipped.

import type { GenerationWarning } from './types.ts';

export interface HintSpec {
  chromaScale?: number;
  modeBias?: 'dark' | 'light';
  bgLNudge?: number;
  radius?: 'sharp' | 'soft';
  fontStance?: 'mono';
  /** Pull the world hue 30% of the way toward this hue (vintage → 90). */
  hueWarmPull?: number;
}

export const HINT_ONTOLOGY: Readonly<Record<string, HintSpec>> = {
  grimdark: { chromaScale: 0.8, modeBias: 'dark', bgLNudge: -0.015 },
  neon: { chromaScale: 1.25, modeBias: 'dark', bgLNudge: -0.02 },
  cyberpunk: { chromaScale: 1.15, modeBias: 'dark', bgLNudge: -0.01, radius: 'sharp', fontStance: 'mono' },
  pastel: { chromaScale: 0.75, modeBias: 'light', bgLNudge: 0.005, radius: 'soft' },
  noir: { chromaScale: 0.5, modeBias: 'dark' },
  vintage: { chromaScale: 0.85, hueWarmPull: 90 },
  airy: { chromaScale: 0.7, modeBias: 'light' }
};

export interface FoldedHints {
  chromaScale: number;
  modeBias: 'dark' | 'light' | null;
  bgLNudge: number;
  radius: 'sharp' | 'soft' | null;
  fontStance: 'mono' | null;
  hueWarmPull: number | null;
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

export const foldHints = (
  hints: readonly string[]
): { folded: FoldedHints; warnings: GenerationWarning[] } => {
  const warnings: GenerationWarning[] = [];
  const folded: FoldedHints = {
    chromaScale: 1,
    modeBias: null,
    bgLNudge: 0,
    radius: null,
    fontStance: null,
    hueWarmPull: null
  };
  const enumSources: Partial<Record<'modeBias' | 'radius', string>> = {};

  for (const hint of hints) {
    const spec = HINT_ONTOLOGY[hint];
    if (!spec) {
      warnings.push({ kind: 'unknown-hint', hint });
      continue;
    }
    if (spec.chromaScale !== undefined) folded.chromaScale *= spec.chromaScale;
    if (spec.bgLNudge !== undefined) folded.bgLNudge += spec.bgLNudge;
    if (spec.hueWarmPull !== undefined) folded.hueWarmPull = spec.hueWarmPull;
    if (spec.fontStance !== undefined) folded.fontStance = spec.fontStance;
    for (const field of ['modeBias', 'radius'] as const) {
      const value = spec[field];
      if (value === undefined) continue;
      const previous = enumSources[field];
      if (previous !== undefined && folded[field] !== value) {
        warnings.push({ kind: 'hint-conflict', field, hints: [previous, hint] });
      }
      folded[field] = value as never;
      enumSources[field] = hint;
    }
  }
  folded.chromaScale = clamp(folded.chromaScale, 0.5, 1.4);
  folded.bgLNudge = clamp(folded.bgLNudge, -0.03, 0.03);
  return { folded, warnings };
};
