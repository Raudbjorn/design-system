import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Checkbox from './Checkbox.svelte';

describe('Checkbox', () => {
  it('reflects checked into data attribute', () => {
    const { container } = render(Checkbox, { checked: true });
    expect(container.querySelector('[data-sv="checkbox"]')).toHaveAttribute(
      'data-checked',
      'true'
    );
  });
});
