import { describe, expect, it } from 'vitest';
import { smoke } from './smoke';

describe('harness', () => {
  it('runs', () => {
    expect(smoke()).toBe('ok');
  });
});
