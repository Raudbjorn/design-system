import { describe, expect, it } from 'vitest';
import { validateTokenValue } from './validate';

describe('color grammar', () => {
  it('accepts the subset and reports alpha', () => {
    expect(validateTokenValue('color', '#C9A227')).toEqual({ css: '#c9a227', hasAlpha: false });
    expect(validateTokenValue('color', 'rgb(20 18 16)')).toEqual({
      css: '#141210',
      hasAlpha: false
    });
    expect(validateTokenValue('color', 'oklch(0.72 0.11 75)')).toEqual({
      css: '#cd9a50',
      hasAlpha: false
    });
    expect(validateTokenValue('color', '#c9a22780')).toMatchObject({ hasAlpha: true });
  });

  it('rejects hostile and out-of-subset values', () => {
    const hostile = [
      'red',
      'red;}body{background:url(//evil)',
      'url(javascript:alert(1))',
      '\\75 rl(javascript:alert(1))',
      '</style><script>alert(1)</script>',
      'expression(alert(1))',
      'var(--sv-bg)',
      'color-mix(in oklab, red, blue)',
      'linear-gradient(red, blue)',
      { colorSpace: 'srgb', components: [0, 0, 0] }, // object form is build-only
      42,
      null,
      `#${'0'.repeat(80)}`
    ];
    for (const value of hostile) {
      expect(validateTokenValue('color', value), `should reject ${JSON.stringify(value)}`).toBeNull();
    }
  });
});

describe('dimension grammar', () => {
  it('accepts strings and DTCG objects within bounds', () => {
    expect(validateTokenValue('dimension', '6px')).toEqual({ css: '6px', hasAlpha: false });
    expect(validateTokenValue('dimension', '0.25rem')).toEqual({ css: '0.25rem', hasAlpha: false });
    expect(validateTokenValue('dimension', { value: 0, unit: 'px' })).toEqual({
      css: '0',
      hasAlpha: false
    });
  });

  it('rejects negatives, weird units, exponents, and the absurd', () => {
    for (const value of ['-5px', '4vh', '50%', '1e9px', '1001px', '65rem', 'calc(1px + 1px)', 'Infinitypx', 12, '12']) {
      expect(validateTokenValue('dimension', value), `should reject ${value}`).toBeNull();
    }
  });
});

describe('fontFamily grammar', () => {
  it('quotes names, passes generic keywords bare', () => {
    expect(validateTokenValue('fontFamily', ['Alegreya', 'Georgia', 'serif'])).toEqual({
      css: "'Alegreya', 'Georgia', serif",
      hasAlpha: false
    });
    expect(validateTokenValue('fontFamily', 'system-ui')).toEqual({
      css: 'system-ui',
      hasAlpha: false
    });
  });

  it('rejects injection-shaped names and oversized lists', () => {
    const hostile = [
      "Inter'; } body { background: red",
      'Inter; url(x)',
      'Inter"</style>',
      'Inter\\75rl',
      'a/b',
      'x@import',
      ['a', 'b', 'c', 'd', 'e'],
      [],
      ['ok', 42],
      `${'f'.repeat(80)}`
    ];
    for (const value of hostile) {
      expect(validateTokenValue('fontFamily', value), `should reject ${JSON.stringify(value)}`).toBeNull();
    }
  });
});

describe('fontWeight / number grammars', () => {
  it('bounds weights and numbers', () => {
    expect(validateTokenValue('fontWeight', 550)).toEqual({ css: '550', hasAlpha: false });
    expect(validateTokenValue('fontWeight', 'bold')).toEqual({ css: '700', hasAlpha: false });
    expect(validateTokenValue('fontWeight', 0)).toBeNull();
    expect(validateTokenValue('fontWeight', 1001)).toBeNull();
    expect(validateTokenValue('number', 1.45)).toEqual({ css: '1.45', hasAlpha: false });
    expect(validateTokenValue('number', 0)).toBeNull();
    expect(validateTokenValue('number', 101)).toBeNull();
    expect(validateTokenValue('number', Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('shadow grammar', () => {
  it('composes validated fields (alpha legal on shadow colors)', () => {
    expect(
      validateTokenValue('shadow', {
        color: 'rgb(0 0 0 / 0.3)',
        offsetX: '0px',
        offsetY: '1px',
        blur: '2px'
      })
    ).toEqual({ css: '0 1px 2px #0000004d', hasAlpha: false });
    expect(
      validateTokenValue('shadow', [
        { color: '#000000', offsetX: '-2px', offsetY: '2px', blur: '4px', spread: '1px', inset: true }
      ])
    ).toEqual({ css: 'inset -2px 2px 4px 1px #000000', hasAlpha: false });
  });

  it('rejects raw strings, negative blur, oversized offsets, and >4 layers', () => {
    expect(validateTokenValue('shadow', '0 0 0 red')).toBeNull();
    expect(
      validateTokenValue('shadow', { color: '#000', offsetX: '0px', offsetY: '0px', blur: '-1px' })
    ).toBeNull();
    expect(
      validateTokenValue('shadow', { color: '#000', offsetX: '500px', offsetY: '0px', blur: '0px' })
    ).toBeNull();
    const layer = { color: '#000', offsetX: '0px', offsetY: '0px', blur: '1px' };
    expect(validateTokenValue('shadow', [layer, layer, layer, layer, layer])).toBeNull();
  });
});
