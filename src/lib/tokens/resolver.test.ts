import { describe, expect, it } from 'vitest';
import {
  mergeDocuments,
  parseTokenDocument,
  resolveDtcgTree,
  resolveTokens,
  toCss,
  toQt
} from './resolver';
import type { TokenDocument, TokenError } from './resolver';

const doc = (json: unknown, source?: string): TokenDocument => {
  const parsed = parseTokenDocument(json, source);
  if (!parsed.ok) throw new Error(`fixture failed to parse: ${JSON.stringify(parsed.error)}`);
  return parsed.value;
};

const errorsOf = <T>(result: { ok: true; value: T } | { ok: false; error: TokenError[] }) => {
  expect(result.ok).toBe(false);
  return result.ok ? [] : result.error;
};

describe('parseTokenDocument', () => {
  it('rejects non-object documents', () => {
    for (const bad of [null, 42, 'hi', [1]]) {
      const errs = errorsOf(parseTokenDocument(bad));
      expect(errs[0]?.kind).toBe('invalid-document');
    }
  });

  it('rejects invalid names, tokens with children, and unknown $-properties', () => {
    const errs = errorsOf(
      parseTokenDocument({
        'Bad Name': { $value: '#fff', $type: 'color' },
        nested: {
          token: { $value: '#fff', $type: 'color', child: { $value: '#000' } }
        },
        weird: { $value: '#fff', $type: 'color', $ref: '#/x' }
      })
    );
    const kinds = errs.map((e) => `${e.kind}:${e.path}`).sort();
    expect(kinds).toEqual([
      'invalid-document:nested.token.child',
      'invalid-document:weird',
      'invalid-name:Bad Name'
    ]);
  });

  it('tolerates $extensions/$deprecated/$schema without behavior', () => {
    const parsed = parseTokenDocument({
      $schema: 'https://example/schema.json',
      color: {
        $type: 'color',
        accent: { $value: '#4ec9b0', $extensions: { 'com.example': 1 }, $deprecated: true }
      }
    });
    expect(parsed.ok).toBe(true);
  });
});

describe('structural resolution (resolveDtcgTree)', () => {
  it('flattens groups, inherits $type from the nearest ancestor, keeps raw values', () => {
    const result = resolveDtcgTree({
      color: {
        $type: 'color',
        bg: { $value: '#191919' },
        syn: {
          keyword: { $value: '#569cd6' },
          odd: { $type: 'dimension', $value: '4px' }
        }
      }
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const byPath = new Map(result.value.map((t) => [t.path.join('.'), t]));
    expect(byPath.get('color.bg')?.type).toBe('color');
    expect(byPath.get('color.syn.keyword')?.type).toBe('color');
    expect(byPath.get('color.syn.odd')?.type).toBe('dimension'); // own $type wins
    expect(byPath.get('color.bg')?.value).toBe('#191919');
  });

  it('resolves alias chains and records the terminal target', () => {
    const result = resolveDtcgTree({
      primitive: { $type: 'color', teal: { $value: '#4ec9b0' } },
      a: { $type: 'color', $value: '{b}' },
      b: { $type: 'color', $value: '{primitive.teal}' }
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const a = result.value.find((t) => t.path.join('.') === 'a');
    expect(a?.value).toBe('#4ec9b0');
    expect(a?.aliasOf).toBe('primitive.teal');
  });

  it('reports unknown aliases once, even when referenced repeatedly', () => {
    const errs = errorsOf(
      resolveDtcgTree({
        $type: 'color',
        broken: { $value: '{missing.token}' },
        user1: { $value: '{broken}' },
        user2: { $value: '{broken}' }
      })
    );
    expect(errs).toHaveLength(1);
    expect(errs[0]?.kind).toBe('unknown-alias');
    expect(errs[0]?.path).toBe('broken');
  });

  it('detects alias cycles with the full chain', () => {
    const errs = errorsOf(
      resolveDtcgTree({
        $type: 'color',
        a: { $value: '{b}' },
        b: { $value: '{c}' },
        c: { $value: '{a}' }
      })
    );
    const cycle = errs.find((e) => e.kind === 'alias-cycle');
    expect(cycle?.chain).toEqual(['a', 'b', 'c', 'a']);
  });

  it('detects self-cycles', () => {
    const errs = errorsOf(resolveDtcgTree({ $type: 'color', a: { $value: '{a}' } }));
    expect(errs[0]?.kind).toBe('alias-cycle');
    expect(errs[0]?.chain).toEqual(['a', 'a']);
  });

  it('flags type mismatches across alias boundaries', () => {
    const errs = errorsOf(
      resolveDtcgTree({
        space: { $type: 'dimension', four: { $value: '4px' } },
        oops: { $type: 'color', $value: '{space.four}' }
      })
    );
    expect(errs[0]?.kind).toBe('type-mismatch');
    expect(errs[0]?.path).toBe('oops');
  });

  it('substitutes aliases inside composite (shadow) fields', () => {
    const result = resolveDtcgTree({
      primitive: { $type: 'color', shade: { $value: '#00000059' } },
      shadow: {
        sm: {
          $type: 'shadow',
          $value: { color: '{primitive.shade}', offsetX: '0px', offsetY: '1px', blur: '2px' }
        }
      }
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sm = result.value.find((t) => t.path.join('.') === 'shadow.sm');
    expect((sm?.value as { color: string }).color).toBe('#00000059');
  });
});

describe('mergeDocuments', () => {
  it('deep-merges groups with later documents winning per token', () => {
    const base = doc(
      {
        color: { $type: 'color', bg: { $value: '#191919' }, accent: { $value: '#4ec9b0' } }
      },
      'base'
    );
    const over = doc({ color: { accent: { $value: '#c9a227' } } }, 'world');
    const merged = mergeDocuments([base, over]);
    const result = resolveTokens(merged);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.get('color.bg')?.value).toEqual({ kind: 'color', hex: '#191919' });
    expect(result.value.get('color.accent')?.value).toEqual({ kind: 'color', hex: '#c9a227' });
    // group-level $type from base survives the merge for the override
    expect(result.value.get('color.accent')?.type).toBe('color');
  });

  it('can create alias cycles across merged documents (resolved post-merge)', () => {
    const base = doc({
      $type: 'color',
      a: { $value: '#111111' },
      b: { $value: '{a}' }
    });
    const over = doc({ a: { $value: '{b}' } });
    const result = resolveTokens(mergeDocuments([base, over]));
    const errs = errorsOf(result);
    expect(errs.some((e) => e.kind === 'alias-cycle')).toBe(true);
  });
});

describe('resolveTokens (typed values)', () => {
  it('parses every supported $type', () => {
    const result = resolveTokens(
      doc({
        c1: { $type: 'color', $value: '#4EC9B0' },
        c2: { $type: 'color', $value: 'rgb(78 201 176)' },
        c3: {
          $type: 'color',
          $value: { colorSpace: 'srgb', components: [1, 1, 1], alpha: 0.5 }
        },
        c4: { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#191919' } },
        d1: { $type: 'dimension', $value: { value: 0.25, unit: 'rem' } },
        d2: { $type: 'dimension', $value: '4px' },
        f1: { $type: 'fontFamily', $value: ['Inter', 'system-ui', 'sans-serif'] },
        f2: { $type: 'fontFamily', $value: 'Iosevka' },
        w1: { $type: 'fontWeight', $value: 550 },
        w2: { $type: 'fontWeight', $value: 'bold' },
        n1: { $type: 'number', $value: 1.5 },
        s1: {
          $type: 'shadow',
          $value: [
            { color: '#00000059', offsetX: '0px', offsetY: '1px', blur: '2px' },
            { color: '#00000030', offsetX: '0px', offsetY: '2px', blur: '8px', spread: '1px', inset: true }
          ]
        }
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const v = (p: string) => result.value.get(p)?.value;
    expect(v('c1')).toEqual({ kind: 'color', hex: '#4ec9b0' });
    expect(v('c2')).toEqual({ kind: 'color', hex: '#4ec9b0' });
    expect(v('c3')).toEqual({ kind: 'color', hex: '#ffffff80' });
    expect(v('c4')).toEqual({ kind: 'color', hex: '#191919' });
    expect(v('d1')).toEqual({ kind: 'dimension', value: 0.25, unit: 'rem' });
    expect(v('d2')).toEqual({ kind: 'dimension', value: 4, unit: 'px' });
    expect(v('f1')).toEqual({ kind: 'fontFamily', families: ['Inter', 'system-ui', 'sans-serif'] });
    expect(v('w2')).toEqual({ kind: 'fontWeight', weight: 700 });
    expect(v('s1')).toMatchObject({
      kind: 'shadow',
      layers: [
        { color: '#00000059', spread: { value: 0, unit: 'px' }, inset: false },
        { color: '#00000030', spread: { value: 1, unit: 'px' }, inset: true }
      ]
    });
  });

  it('fails closed on missing/unknown types and invalid values, collecting all errors', () => {
    const errs = errorsOf(
      resolveTokens(
        doc({
          untyped: { $value: '#fff' },
          exotic: { $type: 'cubicBezier', $value: [0, 0, 1, 1] },
          'bad-color': { $type: 'color', $value: 'red' },
          'bad-dim': { $type: 'dimension', $value: '4vh' },
          'bad-weight': { $type: 'fontWeight', $value: 1001 }
        })
      )
    );
    const kinds = errs.map((e) => `${e.kind}:${e.path}`).sort();
    expect(kinds).toEqual([
      'invalid-value:bad-color',
      'invalid-value:bad-dim',
      'invalid-value:bad-weight',
      'missing-type:untyped',
      'unknown-type:exotic'
    ]);
  });
});

describe('serialization', () => {
  it('toCss renders each kind', () => {
    expect(toCss({ kind: 'color', hex: '#4ec9b0' })).toBe('#4ec9b0');
    expect(toCss({ kind: 'dimension', value: 0.25, unit: 'rem' })).toBe('0.25rem');
    expect(toCss({ kind: 'fontFamily', families: ['Inter', 'system-ui', 'sans-serif'] })).toBe(
      "'Inter', system-ui, sans-serif"
    );
    expect(toCss({ kind: 'fontWeight', weight: 550 })).toBe('550');
    expect(toCss({ kind: 'number', value: 1.5 })).toBe('1.5');
    expect(
      toCss({
        kind: 'shadow',
        layers: [
          {
            color: '#00000059',
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 1, unit: 'px' },
            blur: { value: 2, unit: 'px' },
            spread: { value: 0, unit: 'px' },
            inset: false
          }
        ]
      })
    ).toBe('0 1px 2px #00000059');
  });

  it('shadows round-trip the hand-authored scale.css form byte-exact', () => {
    const result = resolveTokens(
      doc({
        'shadow-sm': {
          $type: 'shadow',
          $value: { color: 'rgb(0 0 0 / 0.3)', offsetX: '0px', offsetY: '1px', blur: '2px' }
        }
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(toCss(result.value.get('shadow-sm')!.value)).toBe('0 1px 2px rgb(0 0 0 / 0.3)');
  });

  it('toQt flattens rem to px at 16px/rem and double-quotes families', () => {
    expect(toQt({ kind: 'dimension', value: 0.25, unit: 'rem' })).toBe('4px');
    expect(toQt({ kind: 'dimension', value: 6, unit: 'px' })).toBe('6px');
    expect(toQt({ kind: 'fontFamily', families: ['Inter', 'sans-serif'] })).toBe('"Inter", sans-serif');
    expect(toQt({ kind: 'color', hex: '#4ec9b0' })).toBe('#4ec9b0');
  });

  it('toQt also flattens rem inside shadow layers (QSS has no rem)', () => {
    const shadow: Parameters<typeof toQt>[0] = {
      kind: 'shadow',
      layers: [
        {
          color: '#00000059',
          offsetX: { value: 0, unit: 'px' },
          offsetY: { value: 0.125, unit: 'rem' },
          blur: { value: 0.25, unit: 'rem' },
          spread: { value: 0.0625, unit: 'rem' },
          inset: false
        }
      ]
    };
    expect(toQt(shadow)).toBe('0 2px 4px 1px #00000059');
    // toCss must keep the authored rem units — only toQt flattens.
    expect(toCss(shadow)).toBe('0 0.125rem 0.25rem 0.0625rem #00000059');
  });
});
