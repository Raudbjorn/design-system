import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Switch from './Switch.svelte';

describe('Switch', () => {
  it('reflects checked into aria/data', () => {
    const { container } = render(Switch, { checked: true });
    const el = container.querySelector('[data-sv="switch"]');
    expect(el).toHaveAttribute('data-on', 'true');
    expect(el).toHaveAttribute('aria-checked', 'true');
  });
});
