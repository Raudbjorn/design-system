import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import Tabs from './Tabs.svelte';

describe('Tabs', () => {
  it('applies roving tabindex to the active tab', () => {
    render(Tabs, {
      tabs: [
        { id: 'a', label: 'A', tabId: 'a-tab', panelId: 'a-panel' },
        { id: 'b', label: 'B', tabId: 'b-tab', panelId: 'b-panel' }
      ],
      value: 'a'
    });
    const a = screen.getByText('A');
    expect(a).toHaveAttribute('aria-selected', 'true');
    expect(a).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('B')).toHaveAttribute('tabindex', '-1');
    expect(a).toHaveAttribute('id', 'a-tab');
    expect(a).toHaveAttribute('aria-controls', 'a-panel');
    expect(screen.getByRole('tablist')).toHaveAccessibleName('Tabs');
  });

  it('normalizes invalid values and notifies controlled consumers', async () => {
    const onchange = vi.fn();
    const tabs = [
      { id: 'a', label: 'A', tabId: 'a-tab', panelId: 'a-panel' },
      { id: 'b', label: 'B', tabId: 'b-tab', panelId: 'b-panel' }
    ];
    const { rerender } = render(Tabs, {
      tabs,
      value: 'missing',
      onchange
    });
    await waitFor(() => expect(screen.getByText('A')).toHaveAttribute('tabindex', '0'));
    expect(onchange).toHaveBeenCalledWith('a');
    expect(onchange).toHaveBeenCalledOnce();
    await rerender({ tabs: [...tabs], value: 'missing', onchange });
    expect(onchange).toHaveBeenCalledOnce();
  });
});
