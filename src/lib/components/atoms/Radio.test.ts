import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import Radio from './Radio.svelte';

describe('Radio', () => {
  it('reflects the selected group in the native control', () => {
    const { container } = render(Radio, { name: 'g', value: 'x', group: 'x' });
    expect(container.querySelector('input')).toBeChecked();
  });

  it('keeps unbound radios with the same name visually exclusive', async () => {
    const firstRender = render(Radio, { name: 'backend', value: 'sycl' });
    const secondRender = render(Radio, { name: 'backend', value: 'vulkan' });
    const first = firstRender.container.querySelector<HTMLInputElement>('input');
    const second = secondRender.container.querySelector<HTMLInputElement>('input');
    if (!first || !second) throw new Error('radio input missing');

    await fireEvent.click(first);
    await fireEvent.click(second);
    expect(first).not.toBeChecked();
    expect(second).toBeChecked();
  });
});
