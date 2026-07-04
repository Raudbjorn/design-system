import { describe, expect, it } from 'vitest';
import { applyContrastGate } from './gate';
import { checkThemeAA } from '../internal/invariants';
import { palettes } from '../tokens/palette';

const gate = (
  overrides: Record<string, string>,
  policy: 'revert' | 'reject' | 'keep' = 'revert',
  base: Readonly<Record<string, string>> = palettes.dark
) => applyContrastGate(new Map(Object.entries(overrides)), base, policy);

describe('revert policy', () => {
  it('reverts a failing foreground override and reports the detail', () => {
    const result = gate({ text: '#333333' }); // ~2:1 on dark bg
    expect(result.fatal).toBe(false);
    expect(result.overrides.has('text')).toBe(false);
    const issue = result.issues.find((i) => i.code === 'W_CONTRAST_REVERTED');
    expect(issue?.token).toBe('text');
    expect(issue?.detail).toMatchObject({ bg: 'bg', required: 4.5, revertedTo: palettes.dark.text });
  });

  it('prefers reverting the fg; reverts the bg only when the fg is not overridden', () => {
    // A near-white bg makes the inherited dark text ladder fail — bg is the
    // only overridden member, so bg reverts.
    const result = gate({ bg: '#eeeeee' });
    expect(result.overrides.has('bg')).toBe(false);
    expect(result.issues.some((i) => i.token === 'bg')).toBe(true);
  });

  it('walks cascading failures to a fixpoint that always passes', () => {
    // Both members overridden and mutually failing, plus a failing syn color.
    const result = gate({
      bg: '#777777',
      text: '#888888',
      'syn-comment': '#3a3a3a'
    });
    const effective: Record<string, string> = { ...palettes.dark };
    for (const [token, value] of result.overrides) effective[token] = value;
    expect(checkThemeAA(effective).filter((c) => !c.pass)).toEqual([]);
  });

  it('passes through overrides that meet every rule untouched', () => {
    const result = gate({ accent: '#c9a227' });
    expect(result.overrides.get('accent')).toBe('#c9a227');
    expect(result.issues).toEqual([]);
  });

  it('gates against the light base when asked', () => {
    const result = gate({ text: '#9a9a9a' }, 'revert', palettes.light);
    expect(result.overrides.has('text')).toBe(false);
  });
});

describe('reject and keep policies', () => {
  it('reject reports E_CONTRAST and marks fatal, keeping the map intact', () => {
    const result = gate({ text: '#333333' }, 'reject');
    expect(result.fatal).toBe(true);
    expect(result.issues[0]?.code).toBe('E_CONTRAST');
    expect(result.overrides.get('text')).toBe('#333333');
  });

  it('keep downgrades failures to warnings and keeps the tokens', () => {
    const result = gate({ text: '#333333' }, 'keep');
    expect(result.fatal).toBe(false);
    expect(result.issues[0]?.code).toBe('W_CONTRAST_FAILED');
    expect(result.overrides.get('text')).toBe('#333333');
  });
});
