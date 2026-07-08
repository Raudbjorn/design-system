import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Tooltip from './Tooltip.svelte';

describe('Tooltip', () => {
  it('renders a labeled tooltip role when opened', async () => {
    const { container } = render(Tooltip, {
      content: 'Hi',
      children: createRawSnippet(() => ({ render: () => '<button type="button">btn</button>' }))
    });
    const trigger = container.querySelector('[data-sv="tooltip-wrap"]');
    if (!trigger) throw new Error('tooltip trigger missing');
    await fireEvent.mouseEnter(trigger);
    const el = container.querySelector('[data-sv="tooltip"]');
    const button = container.querySelector('button');
    expect(el).toHaveAttribute('role', 'tooltip');
    expect(el).toHaveTextContent('Hi');
    expect(button).toHaveAttribute('aria-describedby', el?.id);
  });
});
