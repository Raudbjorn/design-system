import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Modal from './Modal.svelte';
import Sheet from './Sheet.svelte';

describe('Modal', () => {
  it('renders a labeled dialog when open', () => {
    const { container } = render(Modal, {
      open: true,
      title: 'Settings',
      children: createRawSnippet(() => ({ render: () => '<span>body</span>' }))
    });
    const modal = container.querySelector('[data-sv="modal"]');
    const titleSpan = container.querySelector('[data-sv="modal-title"]');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', titleSpan?.id);
    expect(container).toHaveTextContent('Settings');
  });

  it('accepts aria-label when no title is present', () => {
    const { container } = render(Modal, {
      open: true,
      'aria-label': 'Filters',
      children: createRawSnippet(() => ({ render: () => '<span>body</span>' }))
    });
    expect(container.querySelector('[data-sv="modal"]')).toHaveAttribute('aria-label', 'Filters');
  });

  it('routes Escape to only the topmost overlay and restores the scroll lock', async () => {
    const modalClose = vi.fn();
    const sheetClose = vi.fn();
    const previousOverflow = document.body.style.overflow;
    const children = createRawSnippet(() => ({ render: () => '<button>Action</button>' }));
    const modalRender = render(Modal, {
      open: true,
      title: 'Base dialog',
      onclose: modalClose,
      children
    });
    expect(document.body.style.overflow).toBe('hidden');

    const sheetRender = render(Sheet, {
      open: true,
      title: 'Top drawer',
      onclose: sheetClose,
      children
    });
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(sheetClose).toHaveBeenCalledOnce();
    expect(modalClose).not.toHaveBeenCalled();

    sheetRender.unmount();
    await fireEvent.keyDown(document, { key: 'Escape' });
    expect(modalClose).toHaveBeenCalledOnce();

    modalRender.unmount();
    expect(document.body.style.overflow).toBe(previousOverflow);
  });

  it('recaptures focus when the active control leaves the dialog', async () => {
    const { container } = render(Modal, {
      open: true,
      title: 'Focus test',
      children: createRawSnippet(() => ({ render: () => '<button>Inside</button>' }))
    });
    const modal = container.querySelector<HTMLElement>('[data-sv="modal"]');
    if (!modal) throw new Error('modal missing');
    document.body.tabIndex = -1;
    document.body.focus();

    await fireEvent.keyDown(document, { key: 'Tab' });
    expect(modal.contains(document.activeElement)).toBe(true);
    document.body.removeAttribute('tabindex');
  });
});
