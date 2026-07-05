// Terminology metric — a producer/CI-side quality check, OFF the runtime parse
// path. Per WMT25: terminology adherence must be measured by a dedicated
// term-specific metric because it does NOT correlate with general quality
// signals, and terminology is not near-solved at UI scale. Warnings only — a
// missed diegetic term must never blank the UI; CI decides on `!report.ok`.

import type { VernacularCatalog, VernacularIssue } from './types.ts';

export interface TermRule {
  id: string;
  /** The required diegetic term the applicable slots should contain. */
  required: string;
  /** Synonyms that must NOT appear (drift). */
  forbidden?: string[];
  /** Dotted-key globs this rule applies to; omitted = all slots. `*` wildcard. */
  appliesTo?: string[];
  /** Default false (case-insensitive). */
  caseSensitive?: boolean;
}

export interface Glossary {
  terms: TermRule[];
}

export interface TerminologyReport {
  /** 0..1 over applicable slots that contain their required term. */
  coverage: number;
  perTerm: Array<{
    id: string;
    required: string;
    covered: number;
    total: number;
    missesIn: string[];
    driftIn: string[];
  }>;
  issues: VernacularIssue[];
  /** coverage === 1 && no drift — the CI gate. */
  ok: boolean;
}

const globToRe = (glob: string): RegExp =>
  new RegExp('^' + glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');

const applies = (key: string, globs: readonly string[] | undefined): boolean =>
  globs === undefined || globs.some((g) => globToRe(g).test(key));

const contains = (haystack: string, needle: string, caseSensitive: boolean): boolean => {
  // Word-boundary-ish: match the term as a token, NFC-normalized.
  const h = haystack.normalize('NFC');
  const n = needle.normalize('NFC');
  const flags = caseSensitive ? 'u' : 'iu';
  const re = new RegExp(`(^|\\W)${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\W|$)`, flags);
  return re.test(h);
};

/** Measure a catalog against a glossary. Pure; safe to run in CI. */
export const checkTerminology = (catalog: VernacularCatalog, glossary: Glossary): TerminologyReport => {
  const slots = [...catalog.strings.entries()];
  const issues: VernacularIssue[] = [];
  let coveredSlots = 0;
  let totalSlots = 0;

  const perTerm = glossary.terms.map((rule) => {
    const cs = rule.caseSensitive ?? false;
    const applicable = slots.filter(([key]) => applies(key, rule.appliesTo));
    const missesIn: string[] = [];
    const driftIn: string[] = [];
    let covered = 0;
    for (const [key, value] of applicable) {
      if (contains(value, rule.required, cs)) covered++;
      else missesIn.push(key);
      if (rule.forbidden?.some((f) => contains(value, f, cs))) driftIn.push(key);
    }
    coveredSlots += covered;
    totalSlots += applicable.length;
    for (const key of missesIn) {
      issues.push({ severity: 'warning', code: 'W_VERN_TERM_MISSING', key, message: `"${key}" is missing the required term "${rule.required}" (${rule.id})` });
    }
    for (const key of driftIn) {
      issues.push({ severity: 'warning', code: 'W_VERN_TERM_DRIFT', key, message: `"${key}" uses a forbidden synonym for "${rule.required}" (${rule.id})` });
    }
    return { id: rule.id, required: rule.required, covered, total: applicable.length, missesIn, driftIn };
  });

  const coverage = totalSlots === 0 ? 1 : coveredSlots / totalSlots;
  const ok = coverage === 1 && perTerm.every((t) => t.driftIn.length === 0);
  return { coverage, perTerm, issues, ok };
};
