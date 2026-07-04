// Runtime contrast gate: the same CONTRAST_RULES the built-in themes are
// tested against, evaluated on the EFFECTIVE palette (override ?? base) so
// sparse overrides are sound — a world that only changes bg still gets its
// inherited text checked against the new bg.

import { contrastRatio } from '../internal/contrast.ts';
import { CONTRAST_RULES } from '../internal/invariants.ts';
import type { ThemeIssue } from './types.ts';

export interface GateResult {
  /** Surviving color overrides (token → #rrggbb). */
  overrides: Map<string, string>;
  issues: ThemeIssue[];
  fatal: boolean;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Check every contrast rule; on failure follow the policy:
 *  - revert: drop the overridden member (fg first, then bg on the next pass
 *    if the pair still fails) and re-check to a fixpoint. Terminates: each
 *    pass removes at least one override, and the all-reverted state is the
 *    built-in palette, which passes by the invariants self-consistency test.
 *  - reject: report failures as errors, mark fatal.
 *  - keep: report failures as warnings, keep the overrides.
 */
export const applyContrastGate = (
  colorOverrides: ReadonlyMap<string, string>,
  base: Readonly<Record<string, string>>,
  policy: 'revert' | 'reject' | 'keep'
): GateResult => {
  const surviving = new Map(colorOverrides);
  const issues: ThemeIssue[] = [];
  const effective = (token: string): string => surviving.get(token) ?? base[token] ?? '#000000';

  // Bounded by construction; the +2 is headroom, not load-bearing.
  const maxPasses = surviving.size + 2;
  for (let pass = 0; pass < maxPasses; pass++) {
    const failures = CONTRAST_RULES.map((rule) => ({
      rule,
      ratio: contrastRatio(effective(rule.fg), effective(rule.bg))
    })).filter(
      ({ rule, ratio }) =>
        ratio < rule.floor && (surviving.has(rule.fg) || surviving.has(rule.bg))
    );
    if (failures.length === 0) break;

    if (policy === 'keep' || policy === 'reject') {
      for (const { rule, ratio } of failures) {
        const token = surviving.has(rule.fg) ? rule.fg : rule.bg;
        issues.push({
          severity: policy === 'reject' ? 'error' : 'warning',
          code: policy === 'reject' ? 'E_CONTRAST' : 'W_CONTRAST_FAILED',
          token,
          message: `${rule.fg} on ${rule.bg} is ${round2(ratio)}:1, below the ${rule.floor}:1 floor`,
          detail: { fg: rule.fg, bg: rule.bg, ratio: round2(ratio), required: rule.floor }
        });
      }
      return { overrides: surviving, issues, fatal: policy === 'reject' };
    }

    // revert
    const revertedThisPass = new Set<string>();
    for (const { rule, ratio } of failures) {
      const victim = surviving.has(rule.fg) ? rule.fg : rule.bg;
      if (revertedThisPass.has(victim) || !surviving.has(victim)) continue;
      surviving.delete(victim);
      revertedThisPass.add(victim);
      issues.push({
        severity: 'warning',
        code: 'W_CONTRAST_REVERTED',
        token: victim,
        message: `${rule.fg} on ${rule.bg} was ${round2(ratio)}:1 (< ${rule.floor}:1) — "${victim}" reverted to the built-in value`,
        detail: {
          fg: rule.fg,
          bg: rule.bg,
          ratio: round2(ratio),
          required: rule.floor,
          revertedTo: base[victim] ?? ''
        }
      });
    }
  }

  return { overrides: surviving, issues, fatal: false };
};
