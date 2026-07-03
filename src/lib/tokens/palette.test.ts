import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../internal/contrast';
import { dark, light } from './palette';

describe('palette accessibility', () => {
  const bodyTokens = ['text', 'text-strong', 'text-muted', 'text-faint'] as const;

  it('dark body text clears AA on bg', () => {
    for (const t of bodyTokens) {
      expect(contrastRatio(dark[t]!, dark.bg!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('light body text clears AA on bg', () => {
    for (const t of bodyTokens) {
      expect(contrastRatio(light[t]!, light.bg!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('accents clear the 3:1 UI threshold on their bg', () => {
    for (const t of ['accent', 'accent-2'] as const) {
      expect(contrastRatio(dark[t]!, dark.bg!)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(light[t]!, light.bg!)).toBeGreaterThanOrEqual(3);
    }
  });

  it('dark and light define the same token keys', () => {
    expect(Object.keys(dark).sort()).toEqual(Object.keys(light).sort());
  });
});
