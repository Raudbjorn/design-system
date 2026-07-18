import { describe, expect, it, vi } from 'vitest';
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

  it('describes triggers nested through adapter hosts', async () => {
    const { container } = render(Tooltip, {
      content: 'Adapter help',
      children: createRawSnippet(() => ({
        render: () =>
          '<ds-slot><ds-slot><ds-host><button type="button">Nested</button></ds-host></ds-slot></ds-slot>'
      }))
    });
    const wrapper = container.querySelector<HTMLElement>('[data-sv="tooltip-wrap"]');
    const button = container.querySelector('button');
    if (!wrapper || !button) throw new Error('nested tooltip trigger missing');

    await fireEvent.mouseEnter(wrapper);
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(button).toHaveAttribute('aria-describedby', tooltip?.id);
  });

  it('supports SVG triggers and dismisses with Escape', async () => {
    const { container } = render(Tooltip, {
      content: 'Icon help',
      children: createRawSnippet(() => ({
        render: () => '<svg tabindex="0" aria-label="Status"></svg>'
      }))
    });
    const wrapper = container.querySelector<HTMLElement>('[data-sv="tooltip-wrap"]');
    const svg = container.querySelector('svg');
    if (!wrapper || !svg) throw new Error('tooltip elements missing');
    await fireEvent.focusIn(wrapper);
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(svg).toHaveAttribute('aria-describedby', tooltip?.id);
    const bubbled = vi.fn();
    document.addEventListener('keydown', bubbled);
    await fireEvent.keyDown(wrapper, { key: 'Escape' });
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
    expect(bubbled).not.toHaveBeenCalled();
    document.removeEventListener('keydown', bubbled);
    expect(svg).not.toHaveAttribute('aria-describedby');
  });

  it('stays open while focused after hover ends', async () => {
    const { container } = render(Tooltip, {
      content: 'Persistent help',
      children: createRawSnippet(() => ({
        render: () => '<button type="button">trigger</button>'
      }))
    });
    const wrapper = container.querySelector<HTMLElement>('[data-sv="tooltip-wrap"]');
    if (!wrapper) throw new Error('tooltip wrapper missing');

    await fireEvent.focusIn(wrapper);
    await fireEvent.mouseEnter(wrapper);
    await fireEvent.mouseLeave(wrapper);
    expect(container.querySelector('[role="tooltip"]')).toBeTruthy();

    await fireEvent.focusOut(wrapper, { relatedTarget: document.body });
    expect(container.querySelector('[role="tooltip"]')).toBeNull();
  });
});
