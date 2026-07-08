import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Modal from './Modal.svelte';

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
});
