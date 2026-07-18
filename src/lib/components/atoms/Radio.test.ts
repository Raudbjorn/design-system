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

  it('uses native checked state for unbound radio groups', async () => {
    const first = render(Radio, { name: 'backend', value: 'cpu' });
    const second = render(Radio, { name: 'backend', value: 'gpu' });
    const cpu = first.container.querySelector('input');
    const gpu = second.container.querySelector('input');
    if (!cpu || !gpu) throw new Error('radio inputs missing');

    await fireEvent.click(cpu);
    await fireEvent.click(gpu);

    expect(cpu).not.toBeChecked();
    expect(gpu).toBeChecked();
  });
});
