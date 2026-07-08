import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
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
});
