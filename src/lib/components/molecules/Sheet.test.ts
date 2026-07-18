import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Sheet from './Sheet.svelte';

describe('Sheet', () => {
  it('renders a labeled dialog with placement when open', () => {
    const { container } = render(Sheet, {
      open: true,
      title: 'Filters',
      placement: 'left',
      children: createRawSnippet(() => ({ render: () => '<span>body</span>' }))
    });
    expect(container.querySelector('[data-sv="sheet-scrim"]')).toHaveAttribute(
      'data-placement',
      'left'
    );
    const sheet = container.querySelector('[data-sv="sheet"]');
    expect(sheet).toHaveAttribute('role', 'dialog');
    expect(sheet?.getAttribute('aria-labelledby')).toBeTruthy();
  });

  it('accepts aria-label when no title is present', () => {
    const { container } = render(Sheet, {
      open: true,
      placement: 'right',
      'aria-label': 'Queue controls',
      children: createRawSnippet(() => ({ render: () => '<span>body</span>' }))
    });
    expect(container.querySelector('[data-sv="sheet"]')).toHaveAttribute(
      'aria-label',
      'Queue controls'
    );
  });

  it('dismisses only for a primary pointer press on the scrim', async () => {
    const onclose = vi.fn();
    const { container } = render(Sheet, {
      open: true,
      title: 'Filters',
      onclose,
      children: createRawSnippet(() => ({ render: () => '<span>body</span>' }))
    });
    const scrim = container.querySelector<HTMLElement>('[data-sv="sheet-scrim"]');
    if (!scrim) throw new Error('sheet scrim missing');

    await fireEvent.pointerDown(scrim, { button: 1 });
    expect(onclose).not.toHaveBeenCalled();
    await fireEvent.pointerDown(scrim, { button: 0 });
    expect(onclose).toHaveBeenCalledOnce();
  });

  it('handles Escape through the shared overlay stack', async () => {
    const onclose = vi.fn();
    render(Sheet, {
      open: true,
      title: 'Side panel',
      onclose,
      children: createRawSnippet(() => ({ render: () => '<span>body</span>' }))
    });
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(onclose).toHaveBeenCalledOnce();
  });
});
