import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import Checkbox from './Checkbox.svelte';

describe('Checkbox', () => {
  it('reflects checked into data attribute', () => {
    const { container } = render(Checkbox, { checked: true });
    expect(container.querySelector('[data-sv="checkbox"]')).toHaveAttribute(
      'data-checked',
      'true'
    );
  });

  it('reports the new state and forwards native form attributes', async () => {
    const onchange = vi.fn();
    const { container } = render(Checkbox, {
      name: 'feature',
      value: 'enabled',
      onchange
    });
    const input = container.querySelector<HTMLInputElement>('input');
    if (!input) throw new Error('checkbox input missing');
    await fireEvent.click(input);
    expect(onchange).toHaveBeenCalledWith(true);
    expect(input).toHaveAttribute('name', 'feature');
    expect(input).toHaveAttribute('value', 'enabled');
  });
});
