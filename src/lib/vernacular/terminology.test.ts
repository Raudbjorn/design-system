import { describe, expect, it } from 'vitest';
import { checkTerminology } from './terminology';
import { parseVernacular } from './parse';
import type { VernacularCatalog } from './types';

const catalog = (strings: Record<string, unknown>): VernacularCatalog => {
  const r = parseVernacular({ name: 'w', version: '1.0.0', strings });
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
};

describe('checkTerminology', () => {
  it('reports full coverage and an ok gate when the required term is everywhere applicable', () => {
    const cat = catalog({ 'navBar.navLabel': 'Ways', 'navBar.menuLabel': 'Ways menu' });
    const report = checkTerminology(cat, {
      terms: [{ id: 'ways', required: 'Ways', appliesTo: ['navBar.*'] }]
    });
    expect(report.coverage).toBe(1);
    expect(report.ok).toBe(true);
    expect(report.issues).toEqual([]);
  });

  it('flags a missing required term as a warning and drops coverage', () => {
    const cat = catalog({ 'navBar.navLabel': 'Ways', 'navBar.menuLabel': 'Menu' });
    const report = checkTerminology(cat, {
      terms: [{ id: 'ways', required: 'Ways', appliesTo: ['navBar.*'] }]
    });
    expect(report.coverage).toBe(0.5);
    expect(report.ok).toBe(false);
    expect(report.issues.map((i) => i.code)).toContain('W_VERN_TERM_MISSING');
    expect(report.perTerm[0]?.missesIn).toEqual(['navBar.menuLabel']);
  });

  it('flags a forbidden synonym as drift', () => {
    const cat = catalog({ 'navBar.navLabel': 'Menu' });
    const report = checkTerminology(cat, {
      terms: [{ id: 'ways', required: 'Ways', forbidden: ['Menu'] }]
    });
    expect(report.ok).toBe(false);
    expect(report.issues.map((i) => i.code)).toContain('W_VERN_TERM_DRIFT');
  });

  it('uses a Unicode-aware boundary (accented / CJK terms are not matched mid-word)', () => {
    // "café" must not match inside "cafééclair"; "字" must not match inside "漢字".
    const accented = catalog({ 'navBar.navLabel': 'cafééclair' });
    expect(checkTerminology(accented, { terms: [{ id: 'c', required: 'café' }] }).coverage).toBe(0);
    const whole = catalog({ 'navBar.navLabel': 'a café here' });
    expect(checkTerminology(whole, { terms: [{ id: 'c', required: 'café' }] }).coverage).toBe(1);
    const cjk = catalog({ 'navBar.navLabel': '漢字' });
    expect(checkTerminology(cjk, { terms: [{ id: 'j', required: '字' }] }).coverage).toBe(0);
  });

  it('honours case sensitivity', () => {
    const cat = catalog({ 'navBar.navLabel': 'ways' });
    const insensitive = checkTerminology(cat, { terms: [{ id: 't', required: 'Ways' }] });
    const sensitive = checkTerminology(cat, {
      terms: [{ id: 't', required: 'Ways', caseSensitive: true }]
    });
    expect(insensitive.coverage).toBe(1);
    expect(sensitive.coverage).toBe(0);
  });
});
