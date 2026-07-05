import { describe, expect, it } from 'vitest';
import { diffPlaceholders, extractPlaceholders } from './placeholders';
import { parseVernacular } from './parse';

describe('extractPlaceholders', () => {
  it('finds unique named placeholders, ignoring empty and numeric braces', () => {
    expect(extractPlaceholders('Hi {name}, you have {count} and {count} again')).toEqual([
      'name',
      'count'
    ]);
    expect(extractPlaceholders('nothing {} or {1} here')).toEqual([]);
  });
});

describe('diffPlaceholders', () => {
  it('reports missing and extra names', () => {
    expect(diffPlaceholders(['count'], [])).toEqual({ missing: ['count'], extra: [] });
    expect(diffPlaceholders([], ['smuggled'])).toEqual({ missing: [], extra: ['smuggled'] });
    expect(diffPlaceholders(['count'], ['count'])).toEqual({ missing: [], extra: [] });
  });
});

describe('parse integration', () => {
  it('rejects an override that smuggles a placeholder into a fixed-label slot', () => {
    // Every current registry key requires the empty set, so any {x} is `extra`.
    const r = parseVernacular({
      name: 'w',
      version: '1.0.0',
      strings: { 'codeBlock.copyLabel': 'Copy {n}' }
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const issue = r.value.issues.find((i) => i.code === 'E_VERN_PLACEHOLDER');
    expect(issue?.detail).toEqual({ missing: [], extra: ['n'] });
    expect(r.value.strings.has('codeBlock.copyLabel')).toBe(false);
  });
});
