import { describe, expect, it } from 'vitest';
import { parseSafeString } from './grammar';

const cp = (n: number) => String.fromCodePoint(n);
const ZWJ = cp(0x200d);
const ZWNJ = cp(0x200c);

const ok = (raw: unknown, maxLen = 48) => {
  const r = parseSafeString(raw, maxLen);
  return r.ok ? r.value : null;
};
const code = (raw: unknown, maxLen = 48) => {
  const r = parseSafeString(raw, maxLen);
  return r.ok ? null : r.code;
};

describe('parseSafeString — accepts', () => {
  it('ordinary labels, trimming and NFC-normalizing', () => {
    expect(ok('  Transcribe  ')).toEqual({ text: 'Transcribe', length: 10 });
    // decomposed e + combining acute → single NFC code point
    expect(ok(`Caf${cp(0x65)}${cp(0x301)}`)).toEqual({ text: 'Café', length: 4 });
  });

  it('markup characters raw (escaped later at the sink, not rejected here)', () => {
    expect(ok('Save & Exit')?.text).toBe('Save & Exit');
    expect(ok('Copy <div>')?.text).toBe('Copy <div>');
    expect(ok('Press "Enter"')?.text).toBe('Press "Enter"');
    expect(ok('</style>')?.text).toBe('</style>');
  });

  it('emoji ZWJ / ZWNJ sequences (load-bearing joiners)', () => {
    const family = `\u{1F468}${ZWJ}\u{1F469}${ZWJ}\u{1F467}`; // 👨‍👩‍👧
    expect(ok(family)?.text).toBe(family);
    const arabic = `م${ZWNJ}ن`; // ZWNJ between Arabic letters
    expect(ok(arabic)?.text).toBe(arabic);
  });

  it('counts length in code points, not UTF-16 units', () => {
    // 3 astral emoji = 3 code points, 6 UTF-16 units → passes a maxLen of 3.
    expect(ok('\u{1F600}\u{1F601}\u{1F602}', 3)?.length).toBe(3);
  });
});

describe('parseSafeString — rejects (hostile vectors)', () => {
  it('bidi override / isolate (Trojan Source)', () => {
    expect(code(`Cop${cp(0x202e)}y`)).toBe('E_VERN_BIDI'); // RLO
    expect(code(`a${cp(0x2066)}b`)).toBe('E_VERN_BIDI'); // LRI
    expect(code(`a${cp(0x200f)}b`)).toBe('E_VERN_BIDI'); // RLM
    expect(code(`a${cp(0x061c)}b`)).toBe('E_VERN_BIDI'); // ALM
  });

  it('control characters (C0, DEL, C1)', () => {
    expect(code(`a${cp(0x07)}b`)).toBe('E_VERN_CONTROL'); // BEL
    expect(code(`a${cp(0x7f)}b`)).toBe('E_VERN_CONTROL'); // DEL
    expect(code('a\tb')).toBe('E_VERN_CONTROL'); // tab
    expect(code('a\nb')).toBe('E_VERN_CONTROL'); // newline
    expect(code(`a${cp(0x85)}b`)).toBe('E_VERN_CONTROL'); // NEL (C1)
  });

  it('invisible format characters (ZWSP, BOM, word-joiner)', () => {
    expect(code(`a${cp(0x200b)}b`)).toBe('E_VERN_FORMAT'); // ZWSP
    expect(code(`a${cp(0xfeff)}b`)).toBe('E_VERN_FORMAT'); // BOM
    expect(code(`a${cp(0x2060)}b`)).toBe('E_VERN_FORMAT'); // word joiner
  });

  it('non-strings, blanks, and overlong text', () => {
    expect(code(42)).toBe('E_VERN_TYPE');
    expect(code(null)).toBe('E_VERN_TYPE');
    expect(code({})).toBe('E_VERN_TYPE');
    expect(code(['x'])).toBe('E_VERN_TYPE');
    expect(code('   ')).toBe('E_VERN_EMPTY');
    expect(code('x'.repeat(49), 48)).toBe('E_VERN_LENGTH');
  });
});
