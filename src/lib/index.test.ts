import { describe, expect, it } from 'vitest';
import * as ds from './index';

describe('barrel', () => {
  it('exports all 13 components', () => {
    const names = [
      'Text', 'Heading', 'Button', 'Link', 'Badge', 'Icon', 'Kbd',
      'Avatar', 'Stack', 'Card', 'CodeBlock', 'NavBar', 'StatCard'
    ];
    for (const n of names) expect(ds[n as keyof typeof ds]).toBeTruthy();
  });
});
