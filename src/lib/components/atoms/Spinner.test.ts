import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Spinner from './Spinner.svelte';

describe('Spinner', () => {
  it('exposes an accessible busy name', () => {
    const { container } = render(Spinner, { label: 'Busy' });
    const el = container.querySelector('[data-sv="spinner"]');
    expect(el).toHaveAttribute('role', 'status');
    expect(el).toHaveAttribute('aria-label', 'Busy');
  });
});
