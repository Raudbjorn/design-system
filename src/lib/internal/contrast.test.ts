import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
  it('is 1 for identical colors', () => {
    expect(contrastRatio('#4ec9b0', '#4ec9b0')).toBeCloseTo(1, 5);
  });
  it('is order-independent', () => {
    expect(contrastRatio('#191919', '#d4d4d4')).toBeCloseTo(
      contrastRatio('#d4d4d4', '#191919'),
      5
    );
  });
});
