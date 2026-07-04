import { describe, expect, it } from 'vitest';
import { parseWorldTheme } from './parse';
import type { ThemeIssueCode } from './types';
import grimdark from './fixtures/grimdark.json';

const pkg = (tokens: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  name: 'test-world',
  version: '1.0.0',
  tokens,
  ...extra
});

const codes = (issues: readonly { code: ThemeIssueCode }[]): ThemeIssueCode[] =>
  issues.map((i) => i.code);

describe('input and manifest', () => {
  it('rejects non-objects and unparseable JSON strings', () => {
    for (const bad of [42, null, [], 'not json {']) {
      const result = parseWorldTheme(bad);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(codes(result.error)).toContain('E_INPUT');
    }
  });

  it('accepts a JSON string form', () => {
    const result = parseWorldTheme(JSON.stringify(pkg({ accent: { $value: '#c9a227' } })));
    expect(result.ok).toBe(true);
  });

  it('measures the input-size budget in real UTF-8 bytes, not UTF-16 length', () => {
    // Each CJK char is 1 UTF-16 unit but 3 UTF-8 bytes: length stays under
    // the 256KB budget while the real encoded size is ~3x over it.
    const oversized = 'あ'.repeat(90000);
    const result = parseWorldTheme(oversized);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(codes(result.error)).toContain('E_INPUT');
  });

  it('does not throw when previewing non-JSON-safe values (circular refs, BigInt)', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() =>
      parseWorldTheme(pkg({ accent: { $value: '#c9a227' } }, { extends: circular }))
    ).not.toThrow();
    expect(() =>
      parseWorldTheme(pkg({ accent: { $value: '#c9a227' } }, { extends: 10n }))
    ).not.toThrow();
  });

  it('collects all manifest errors at once', () => {
    const result = parseWorldTheme({ name: 'Bad Name!', version: 'one', extends: 'sepia' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const found = codes(result.error).filter((c) => c === 'E_MANIFEST');
    expect(found).toHaveLength(4); // name, version, extends, missing tokens
  });

  it('caps and reports meta, flags unknown top-level keys, defaults extends to dark', () => {
    const result = parseWorldTheme(
      pkg(
        { accent: { $value: '#c9a227' } },
        { meta: { ok: 'yes', bad: 42 }, surprise: true }
      )
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.manifest.extends).toBe('dark');
    expect(result.value.manifest.meta).toEqual({ ok: 'yes' });
    expect(codes(result.value.issues).filter((c) => c === 'I_META_IGNORED')).toHaveLength(2);
  });
});

describe('token processing', () => {
  it('flattens nested groups with "-" and resolves in-package aliases', () => {
    // syn.var value chosen well above the 4.5:1 floor on dark surface-3 so
    // this test exercises flattening, not the gate.
    const result = parseWorldTheme(
      pkg({
        'accent-2': { $value: '#b5473a' },
        'accent-rust': { $value: '{accent-2}' },
        syn: { $type: 'color', var: { $value: '#9cdcfe' } }
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tokens.get('accent-rust')).toBe('#b5473a');
    expect(result.value.tokens.get('syn-var')).toBe('#9cdcfe');
  });

  it('skips unknown and locked tokens with warnings; reject policy is fatal', () => {
    const input = pkg({
      'not-a-token': { $value: '#ffffff' },
      'z-overlay': { $type: 'number', $value: 9 },
      accent: { $value: '#c9a227' },
      success: { $value: '#00ff00' }
    });
    const skipped = parseWorldTheme(input, { lockedTokens: ['success'] });
    expect(skipped.ok).toBe(true);
    if (!skipped.ok) return;
    expect(codes(skipped.value.issues)).toContain('W_UNKNOWN_TOKEN');
    expect(codes(skipped.value.issues).filter((c) => c === 'W_LOCKED_TOKEN')).toHaveLength(2);
    expect(skipped.value.tokens.has('z-overlay')).toBe(false);
    expect(skipped.value.tokens.has('success')).toBe(false);
    expect(skipped.value.tokens.get('accent')).toBe('#c9a227');

    const rejected = parseWorldTheme(input, { unknownTokens: 'reject' });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(codes(rejected.error)).toContain('E_UNKNOWN_TOKEN');
  });

  it('drops type mismatches, bad values, and alpha on colors — parse survives', () => {
    const result = parseWorldTheme(
      pkg({
        accent: { $type: 'dimension', $value: '4px' },
        'accent-2': { $value: 'not-a-color' },
        error: { $value: '#ff000080' },
        'radius-md': { $value: '8px' }
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(codes(result.value.issues)).toEqual(
      expect.arrayContaining(['E_TYPE_MISMATCH', 'E_VALUE', 'E_ALPHA_ON_GATED'])
    );
    expect(result.value.tokens.size).toBe(1);
    expect(result.value.tokens.get('radius-md')).toBe('8px');
  });

  it('DTCG failures (alias cycle) are fatal', () => {
    const result = parseWorldTheme(
      pkg({ accent: { $value: '{accent-2}' }, 'accent-2': { $value: '{accent}' } })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(codes(result.error)).toContain('E_DTCG');
  });

  it('warns on an all-skipped (empty) theme and notes mix-target overrides', () => {
    const empty = parseWorldTheme(pkg({ nothing: { $value: '#fff' } }));
    expect(empty.ok).toBe(true);
    if (empty.ok) expect(codes(empty.value.issues)).toContain('W_EMPTY');

    const mix = parseWorldTheme(pkg({ 'mix-target': { $value: '#e0e0e0' } }));
    expect(mix.ok).toBe(true);
    if (mix.ok) expect(codes(mix.value.issues)).toContain('I_MIX_TARGET_OVERRIDE');
  });
});

describe('gate integration', () => {
  it('gates against the light palette when extends: light', () => {
    // #9a9a9a text is fine on dark bg (6.25:1) but fails on light paper.
    const result = parseWorldTheme(
      pkg({ text: { $value: '#9a9a9a' } }, { extends: 'light' })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(codes(result.value.issues)).toContain('W_CONTRAST_REVERTED');
    expect(result.value.tokens.has('text')).toBe(false);
  });

  it('reject policy turns gate failures into a fatal E_CONTRAST', () => {
    const result = parseWorldTheme(pkg({ text: { $value: '#333333' } }), {
      onContrastFailure: 'reject'
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(codes(result.error)).toContain('E_CONTRAST');
  });

  it('keep policy retains failing tokens with warnings', () => {
    const result = parseWorldTheme(pkg({ text: { $value: '#333333' } }), {
      onContrastFailure: 'keep'
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(codes(result.value.issues)).toContain('W_CONTRAST_FAILED');
    expect(result.value.tokens.get('text')).toBe('#333333');
  });
});

describe('grimdark fixture', () => {
  it('parses clean: no errors, no contrast issues, expected overrides', () => {
    const result = parseWorldTheme(grimdark);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const severities = result.value.issues.map((i) => i.severity);
    expect(severities).not.toContain('error');
    expect(codes(result.value.issues)).not.toContain('W_CONTRAST_REVERTED');
    expect(result.value.manifest).toMatchObject({
      name: 'grimdark-hive',
      version: '1.0.0',
      extends: 'dark'
    });
    expect(result.value.tokens.get('bg')).toBe('#141210');
    expect(result.value.tokens.get('accent-rust')).toBe('#b5473a'); // via alias
    expect(result.value.tokens.get('syn-string')).toBe('#cd9a50'); // via oklch()
    expect(result.value.tokens.get('radius-lg')).toBe('6px');
    expect(result.value.tokens.get('font-sans')).toBe("'Alegreya', 'Georgia', serif");
  });
});
