// Value grammar for UNTRUSTED catalog strings — parse-don't-validate.
//
// Strings are widget text / accessible names. Even though Svelte auto-escapes
// at the sink, codepoint hygiene must happen at parse time for EVERY consumer:
// bidi-override (Trojan Source) attacks work on plain text — the rendered label
// and its accessible name read differently than the source bytes, and escaping
// HTML does nothing against them; screen readers announce spoofed/reordered
// labels; overlong strings break UI slots regardless of framework. Markup
// characters (< & > " ') are legitimate in labels and are kept raw here, then
// escaped per-sink (see escape.ts).
//
// Forbidden sets are expressed as numeric code-point tests, not regex literals,
// so no invisible characters live in this source file.

import type { VernacularIssueCode } from './types.ts';

export interface SafeString {
  readonly text: string;
  /** Code-point length (astral chars / emoji count as 1). */
  readonly length: number;
}

export type SafeResult = { ok: true; value: SafeString } | { ok: false; code: VernacularIssueCode };

// Single-line separators, C0 controls (incl. tab/newline), DEL, and C1.
const isControl = (cp: number): boolean =>
  cp <= 0x1f || cp === 0x7f || (cp >= 0x80 && cp <= 0x9f) || cp === 0x2028 || cp === 0x2029;

// Bidi override / embedding / isolate — the Trojan Source set (CVE-2021-42574):
// ALM, LRM, RLM, LRE..RLO/PDF, LRI..RLI/FSI/PDI.
const isBidi = (cp: number): boolean =>
  cp === 0x061c ||
  cp === 0x200e ||
  cp === 0x200f ||
  (cp >= 0x202a && cp <= 0x202e) ||
  (cp >= 0x2066 && cp <= 0x2069);

// Invisible format chars: ZWSP, word-joiner, invisible-math operators, BOM.
// ZWJ (0x200D) and ZWNJ (0x200C) are deliberately ALLOWED — load-bearing in
// real scripts and emoji sequences.
const isFormat = (cp: number): boolean =>
  cp === 0x200b || cp === 0x2060 || (cp >= 0x2061 && cp <= 0x2064) || cp === 0xfeff;

/**
 * Parse an untrusted value into a hygienic SafeString or a reasoned rejection.
 * NFC-normalizes first (stable length + equality; defeats combining-mark
 * padding), then rejects control/bidi/format chars, empties, and overlong text.
 */
export const parseSafeString = (raw: unknown, maxLen: number): SafeResult => {
  if (typeof raw !== 'string') return { ok: false, code: 'E_VERN_TYPE' };
  const nfc = raw.normalize('NFC');
  for (const ch of nfc) {
    const cp = ch.codePointAt(0)!;
    if (isControl(cp)) return { ok: false, code: 'E_VERN_CONTROL' };
    if (isBidi(cp)) return { ok: false, code: 'E_VERN_BIDI' };
    if (isFormat(cp)) return { ok: false, code: 'E_VERN_FORMAT' };
  }
  const text = nfc.trim();
  if (text === '') return { ok: false, code: 'E_VERN_EMPTY' };
  const length = [...text].length;
  if (length > maxLen) return { ok: false, code: 'E_VERN_LENGTH' };
  return { ok: true, value: { text, length } };
};
