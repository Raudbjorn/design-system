import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Radio from './Radio.svelte';

describe('Radio', () => {
  it('reflects selected group into data attribute', () => {
    const { container } = render(Radio, { name: 'g', value: 'x', group: 'x' });
    expect(container.querySelector('[data-sv="radio"]')).toHaveAttribute(
      'data-checked',
      'true'
    );
  });
});
