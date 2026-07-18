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

  it('normalizes non-finite values and always has an accessible name', () => {
    const { container } = render(Progress, {
      value: Number.NaN,
      'aria-label': 'Import progress'
    });
    const el = container.querySelector('[data-sv="progress-track"]');
    expect(el).toHaveAttribute('aria-valuenow', '0');
    expect(el).toHaveAttribute('aria-label', 'Import progress');
    expect(container.querySelector('[data-sv="progress-fill"]')).toHaveStyle({ width: '0%' });
  });
});
