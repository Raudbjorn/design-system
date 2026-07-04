// Contrast-driven lightness solver — the Leonardo idea reduced to what this
// system needs: WCAG targets are INPUTS. Given chroma + hue and a background,
// binary-search OKLCH lightness on the post-gamut-clamp, post-8-bit-rounding
// hex until the contrast target is met at the smallest push away from the
// background. Contrast is monotone in L away from the bg's lightness, so the
// crossing point is well-defined; rounding wobble is absorbed by a final
// outward nudge.

import { hexToOklch, oklchToHex } from '../internal/color.ts';
import { contrastRatio } from '../internal/contrast.ts';

export interface SolveOptions {
  c: number;
  h: number;
  /** #rrggbb the color must contrast against. */
  against: string;
  /** WCAG ratio to reach. */
  target: number;
  /** Search away from the background: 'lighter' (dark themes) or 'darker'. */
  direction: 'lighter' | 'darker';
}

export interface SolveResult {
  hex: string;
  /** Ratio actually achieved by the emitted hex (>= target unless the target
   * is unreachable at this chroma/hue, in which case the extreme is
   * returned and `achieved` reports the shortfall). */
  achieved: number;
  /** Chroma measured from the emitted hex — lower than requested when the
   * gamut clamp bit. */
  effectiveChroma: number;
  l: number;
}

const ITERATIONS = 26;
const NUDGE = 0.002;
const MAX_NUDGES = 12;

export const solveLightness = (opts: SolveOptions): SolveResult => {
  const { c, h, against, target, direction } = opts;
  const bg = hexToOklch(against);
  if (!bg) throw new TypeError(`solveLightness: unparseable background "${against}"`);

  const ratioAt = (l: number): { hex: string; ratio: number } => {
    const hex = oklchToHex({ l, c, h });
    return { hex, ratio: contrastRatio(hex, against) };
  };

  const extreme = direction === 'lighter' ? 1 : 0;
  // If even the extreme misses, the target is unreachable at this chroma.
  if (ratioAt(extreme).ratio < target) {
    const at = ratioAt(extreme);
    const measured = hexToOklch(at.hex);
    return { hex: at.hex, achieved: at.ratio, effectiveChroma: measured?.c ?? 0, l: extreme };
  }

  // Invariant: ratio(near) < target <= ratio(far).
  let near = Math.min(1, Math.max(0, bg.l));
  let far = extreme;
  if (ratioAt(near).ratio >= target) {
    // The bg's own lightness already passes at this chroma/hue (high-chroma
    // color against a near-neutral bg) — near is the answer's floor.
    far = near;
  }
  for (let i = 0; i < ITERATIONS && near !== far; i++) {
    const mid = (near + far) / 2;
    if (ratioAt(mid).ratio >= target) far = mid;
    else near = mid;
  }

  let l = far;
  let candidate = ratioAt(l);
  // 8-bit rounding can leave the crossing a hair short — nudge outward.
  for (let i = 0; i < MAX_NUDGES && candidate.ratio < target; i++) {
    l = direction === 'lighter' ? Math.min(1, l + NUDGE) : Math.max(0, l - NUDGE);
    candidate = ratioAt(l);
  }
  const measured = hexToOklch(candidate.hex);
  return { hex: candidate.hex, achieved: candidate.ratio, effectiveChroma: measured?.c ?? 0, l };
};
