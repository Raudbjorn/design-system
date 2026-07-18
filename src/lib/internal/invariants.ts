// The accessibility contract every theme must satisfy — built-in, ingested
// (runtime world themes), or generated. One rule table, three consumers:
// palette.test.ts (built-ins), the /theme gate (untrusted packages), and the
// /generate final gate (solver output).
//
// "frozen" rules mirror what palette.test.ts has always asserted; "extension"
// rules are additive and verified to pass on both hand-authored themes before
// being adopted (see palette.test.ts), so they can never create a
// built-in/world asymmetry.

import { contrastRatio } from './contrast.ts';

export interface ContrastRule {
  /** Foreground token name (palette key, no --sv- prefix). */
  fg: string;
  /** Background token name. */
  bg: string;
  /** Minimum WCAG 2 contrast ratio. */
  floor: number;
  tier: 'frozen' | 'extension';
}

const BODY_TOKENS = ['text', 'text-strong', 'text-muted', 'text-faint'] as const;
const SYN_TOKENS = [
  'syn-keyword',
  'syn-string',
  'syn-var',
  'syn-func',
  'syn-comment',
  'syn-number'
] as const;

export const CONTRAST_RULES: readonly ContrastRule[] = [
  // Frozen: the contract palette.test.ts has enforced since v1.
  ...BODY_TOKENS.map((fg): ContrastRule => ({ fg, bg: 'bg', floor: 4.5, tier: 'frozen' })),
  { fg: 'accent', bg: 'bg', floor: 3, tier: 'frozen' },
  { fg: 'accent-2', bg: 'bg', floor: 3, tier: 'frozen' },
  ...SYN_TOKENS.map((fg): ContrastRule => ({ fg, bg: 'surface-3', floor: 4.5, tier: 'frozen' })),
  // Extension: additive rules for the world-theme engine. Status colors also
  // serve UI indicators there, so this broader engine retains a 3:1 floor;
  // the component-aware defineTheme API separately gates status text at 4.5:1.
  // Border stays ungated: ~1.6:1 hairline by design.
  { fg: 'success', bg: 'bg', floor: 3, tier: 'extension' },
  { fg: 'error', bg: 'bg', floor: 3, tier: 'extension' },
  { fg: 'warning', bg: 'bg', floor: 3, tier: 'extension' },
  { fg: 'accent-rust', bg: 'bg', floor: 3, tier: 'extension' },
  { fg: 'text-strong', bg: 'surface-3', floor: 4.5, tier: 'extension' },
  { fg: 'text', bg: 'surface-3', floor: 4.5, tier: 'extension' },
  { fg: 'text-muted', bg: 'surface-3', floor: 4.5, tier: 'extension' }
];

export interface ContrastCheck extends ContrastRule {
  fgHex: string;
  bgHex: string;
  /** Achieved WCAG 2 ratio; 0 when either token is missing from the palette. */
  ratio: number;
  pass: boolean;
}

/**
 * Run every contrast rule against a complete palette (token name → #rrggbb).
 * A missing token fails its rules (ratio 0) rather than being skipped —
 * silence must never look like compliance.
 */
export const checkThemeAA = (palette: Readonly<Record<string, string>>): ContrastCheck[] =>
  CONTRAST_RULES.map((rule) => {
    const fgHex = palette[rule.fg];
    const bgHex = palette[rule.bg];
    if (fgHex === undefined || bgHex === undefined) {
      return { ...rule, fgHex: fgHex ?? '', bgHex: bgHex ?? '', ratio: 0, pass: false };
    }
    const ratio = contrastRatio(fgHex, bgHex);
    return { ...rule, fgHex, bgHex, ratio, pass: ratio >= rule.floor };
  });
