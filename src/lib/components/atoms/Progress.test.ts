import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Progress from './Progress.svelte';

describe('Progress', () => {
  it('exposes progressbar value and label', () => {
    const { container } = render(Progress, { value: 42, label: 'Load' });
    const el = container.querySelector('[data-sv="progress-track"]');
    expect(el).toHaveAttribute('role', 'progressbar');
    expect(el).toHaveAttribute('aria-valuenow', '42');
    expect(el).toHaveAttribute('aria-label', 'Load');
  });
});
