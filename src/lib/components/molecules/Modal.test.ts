import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Modal from './Modal.svelte';
import Sheet from './Sheet.svelte';
import { trapFocus } from '../../internal/focus-trap';

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
    const leakedEscape = vi.fn();
    document.addEventListener('keydown', leakedEscape);
    const firstSheetEscape = fireEvent.keyDown(document, { key: 'Escape' });
    const secondSheetEscape = fireEvent.keyDown(document, { key: 'Escape' });
    await Promise.all([firstSheetEscape, secondSheetEscape]);
    expect(sheetClose).toHaveBeenCalledOnce();
    expect(modalClose).not.toHaveBeenCalled();

    sheetRender.unmount();
    const firstModalEscape = fireEvent.keyDown(document, { key: 'Escape' });
    const secondModalEscape = fireEvent.keyDown(document, { key: 'Escape' });
    await Promise.all([firstModalEscape, secondModalEscape]);
    expect(modalClose).toHaveBeenCalledOnce();
    expect(leakedEscape).not.toHaveBeenCalled();

    modalRender.unmount();
    document.removeEventListener('keydown', leakedEscape);
    expect(document.body.style.overflow).toBe(previousOverflow);
  });

  it('lets a nested control consume Escape before overlay routing', async () => {
    const onclose = vi.fn();
    const result = render(Modal, {
      open: true,
      title: 'Dialog',
      onclose,
      children: createRawSnippet(() => ({ render: () => '<button>Nested control</button>' }))
    });
    const button = result.container.querySelector('button');
    if (!button) throw new Error('nested control missing');
    button.addEventListener('keydown', (event) => event.stopPropagation());

    await fireEvent.keyDown(button, { key: 'Escape' });
    expect(onclose).not.toHaveBeenCalled();
    result.unmount();
  });

  it('transfers return focus when a lower overlay unmounts first', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const children = createRawSnippet(() => ({ render: () => '<button>Action</button>' }));
    const modalRender = render(Modal, {
      open: true,
      title: 'Base dialog',
      children
    });
    const sheetRender = render(Sheet, {
      open: true,
      title: 'Top drawer',
      children
    });

    modalRender.unmount();
    sheetRender.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('only closes when a pointer press begins on the scrim', async () => {
    const onclose = vi.fn();
    const { container, unmount } = render(Modal, {
      open: true,
      title: 'Pointer test',
      onclose,
      children: createRawSnippet(() => ({ render: () => '<button>Inside</button>' }))
    });
    const scrim = container.querySelector<HTMLElement>('[data-sv="modal-scrim"]');
    const modal = container.querySelector<HTMLElement>('[data-sv="modal"]');
    if (!scrim || !modal) throw new Error('modal structure missing');

    await fireEvent.pointerDown(modal);
    await fireEvent.pointerUp(scrim);
    await fireEvent.click(scrim);
    expect(onclose).not.toHaveBeenCalled();

    await fireEvent.pointerDown(scrim, { button: 2 });
    expect(onclose).not.toHaveBeenCalled();

    await fireEvent.pointerDown(scrim, { button: 0 });
    expect(onclose).toHaveBeenCalledOnce();
    unmount();
  });

  it('does not finish canceled transition animations', async () => {
    const animation = document.createElement('div').animate([]);
    const onfinish = vi.fn();
    const oncancel = vi.fn();
    animation.onfinish = onfinish;
    animation.oncancel = oncancel;

    animation.cancel();
    await Promise.resolve();
    expect(oncancel).toHaveBeenCalledOnce();
    expect(onfinish).not.toHaveBeenCalled();
  });

  it('does not overwrite scroll restoration for a repeated registration', () => {
    const previousOverflow = document.body.style.overflow;
    const node = document.createElement('div');
    document.body.appendChild(node);
    const first = trapFocus(node, vi.fn());
    const second = trapFocus(node, vi.fn());

    expect(document.activeElement).toBe(node);
    expect(node).toHaveAttribute('tabindex', '-1');
    if (!('destroy' in second) || typeof second.destroy !== 'function') {
      throw new Error('focus trap action missing destroy');
    }
    second.destroy();
    expect(document.body.style.overflow).toBe(previousOverflow);
    expect(node).not.toHaveAttribute('tabindex');

    if ('destroy' in first && typeof first.destroy === 'function') first.destroy();
    node.remove();
  });

  it('does not recenter focus for a repeated registration', () => {
    const node = document.createElement('div');
    const first = document.createElement('button');
    const second = document.createElement('button');
    Object.defineProperty(first, 'offsetParent', { value: node });
    Object.defineProperty(second, 'offsetParent', { value: node });
    node.append(first, second);
    document.body.appendChild(node);

    const initialAction = trapFocus(node, vi.fn());
    expect(document.activeElement).toBe(first);
    second.focus();
    const repeatedAction = trapFocus(node, vi.fn());
    expect(document.activeElement).toBe(second);

    if ('destroy' in repeatedAction && typeof repeatedAction.destroy === 'function') {
      repeatedAction.destroy();
    }
    if ('destroy' in initialAction && typeof initialAction.destroy === 'function') {
      initialAction.destroy();
    }
    node.remove();
  });

  it('keeps visual stacking aligned with focus-trap open order', () => {
    const earlierScrim = document.createElement('div');
    const earlierDialog = document.createElement('div');
    earlierScrim.appendChild(earlierDialog);
    const laterScrim = document.createElement('div');
    const laterDialog = document.createElement('div');
    laterScrim.appendChild(laterDialog);
    document.body.append(earlierScrim, laterScrim);

    const laterAction = trapFocus(laterDialog, vi.fn());
    const earlierAction = trapFocus(earlierDialog, vi.fn());
    expect(laterScrim.style.getPropertyValue('--sv-overlay-stack-index')).toBe('0');
    expect(earlierScrim.style.getPropertyValue('--sv-overlay-stack-index')).toBe('1');

    if ('destroy' in earlierAction && typeof earlierAction.destroy === 'function') {
      earlierAction.destroy();
    }
    expect(laterScrim.style.getPropertyValue('--sv-overlay-stack-index')).toBe('0');
    if ('destroy' in laterAction && typeof laterAction.destroy === 'function') {
      laterAction.destroy();
    }
    earlierScrim.remove();
    laterScrim.remove();
  });

  it('leaves Escape unhandled when the topmost trap declines it', () => {
    const node = document.createElement('div');
    document.body.appendChild(node);
    const action = trapFocus(node, () => false);
    const observer = vi.fn();
    document.addEventListener('keydown', observer);

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(observer).toHaveBeenCalledOnce();
    document.removeEventListener('keydown', observer);
    if ('destroy' in action && typeof action.destroy === 'function') action.destroy();
    node.remove();
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
