import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Breadcrumb from './Breadcrumb.svelte';

describe('Breadcrumb', () => {
  it('marks the last crumb as the current page', () => {
    const { container } = render(Breadcrumb, {
      items: [{ label: 'Home', href: '/' }, { label: 'Now' }]
    });
    const crumbs = container.querySelectorAll('[data-sv="crumb"]');
    expect(crumbs[crumbs.length - 1]).toHaveAttribute('aria-current', 'page');
  });
});
