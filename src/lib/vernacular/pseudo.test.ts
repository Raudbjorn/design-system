import { describe, expect, it } from 'vitest';
import { pseudoLocalize, pseudoLocalizeString } from './pseudo';
import { parseSafeString } from './grammar';
import { VERNACULAR_REGISTRY } from './registry';

describe('pseudoLocalizeString', () => {
  it('accents letters, brackets, and inflates length', () => {
    const out = pseudoLocalizeString('Copy');
    expect(out.startsWith('[[')).toBe(true);
    expect(out.endsWith(']]')).toBe(true);
    expect(out).not.toContain('Copy'); // ASCII letters were accented away
    expect([...out].length).toBeGreaterThanOrEqual([...'Copy'].length * 1.4);
  });

  it('leaves placeholders verbatim', () => {
    const out = pseudoLocalizeString('Hi {name}!');
    expect(out).toContain('{name}');
  });

  it('is deterministic', () => {
    expect(pseudoLocalizeString('Menu')).toBe(pseudoLocalizeString('Menu'));
  });

  it('output re-parses clean through the grammar (no control/bidi/format chars)', () => {
    for (const spec of VERNACULAR_REGISTRY.values()) {
      const out = pseudoLocalizeString(spec.plainDefault);
      // Generous maxLen: pseudo output is intentionally overlong (that's the
      // point) — what matters is that it carries no forbidden characters.
      expect(parseSafeString(out, 999).ok).toBe(true);
    }
  });
});

describe('pseudoLocalize', () => {
  it('covers every registry slot from the English defaults', () => {
    const v = pseudoLocalize();
    expect(v.codeBlock?.copyLabel).toMatch(/^\[\[.*\]\]$/);
    expect(v.navBar?.menuLabel).toMatch(/^\[\[.*\]\]$/);
  });
});
