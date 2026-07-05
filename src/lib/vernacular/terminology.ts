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

// Word-boundary-ish token match, NFC-normalized. Compiled once per term/rule.
const makeContainsRe = (needle: string, caseSensitive: boolean): RegExp => {
  const n = needle.normalize('NFC');
  const flags = caseSensitive ? 'u' : 'iu';
  return new RegExp(`(^|\\W)${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\W|$)`, flags);
};

/** Measure a catalog against a glossary. Pure; safe to run in CI. */
export const checkTerminology = (catalog: VernacularCatalog, glossary: Glossary): TerminologyReport => {
  const slots = [...catalog.strings.entries()];
  const issues: VernacularIssue[] = [];
  let coveredSlots = 0;
  let totalSlots = 0;

  const perTerm = glossary.terms.map((rule) => {
    const cs = rule.caseSensitive ?? false;
    // Compile the glob + term/forbidden matchers once per rule, not per slot.
    const globRes = rule.appliesTo?.map(globToRe);
    const requiredRe = makeContainsRe(rule.required, cs);
    const forbiddenRes = rule.forbidden?.map((f) => makeContainsRe(f, cs));
    const applicable = slots.filter(([key]) => globRes === undefined || globRes.some((re) => re.test(key)));
    const missesIn: string[] = [];
    const driftIn: string[] = [];
    let covered = 0;
    for (const [key, value] of applicable) {
      const normalized = value.normalize('NFC');
      if (requiredRe.test(normalized)) covered++;
      else missesIn.push(key);
      if (forbiddenRes?.some((re) => re.test(normalized))) driftIn.push(key);
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
