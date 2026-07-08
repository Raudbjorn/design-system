import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Tooltip from './Tooltip.svelte';

describe('Tooltip', () => {
  it('renders a labeled tooltip role', () => {
    const { container } = render(Tooltip, {
      content: 'Hi',
      children: createRawSnippet(() => ({ render: () => '<span>btn</span>' }))
    });
    const el = container.querySelector('[data-sv="tooltip"]');
    expect(el).toHaveAttribute('role', 'tooltip');
    expect(el).toHaveTextContent('Hi');
  });
});
