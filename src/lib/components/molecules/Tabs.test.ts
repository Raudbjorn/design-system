import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Tabs from './Tabs.svelte';

describe('Tabs', () => {
  it('applies roving tabindex to the active tab', () => {
    render(Tabs, {
      tabs: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' }
      ],
      value: 'a'
    });
    const a = screen.getByText('A');
    expect(a).toHaveAttribute('aria-selected', 'true');
    expect(a).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('B')).toHaveAttribute('tabindex', '-1');
  });
});
