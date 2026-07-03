import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Button', () => {
  it('renders a button with the primary variant by default', () => {
    render(Button, { children: kids('Go') });
    const btn = screen.getByRole('button', { name: 'Go' });
    expect(btn).toHaveAttribute('data-variant', 'primary');
  });

  it('renders an anchor when href is set', () => {
    render(Button, { href: '/x', children: kids('Link') });
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute('href', '/x');
  });

  it('is disabled and non-clickable when disabled', async () => {
    const onclick = vi.fn();
    render(Button, { disabled: true, onclick, children: kids('No') });
    const btn = screen.getByRole('button', { name: 'No' });
    expect(btn).toBeDisabled();
    btn.click();
    expect(onclick).not.toHaveBeenCalled();
  });

  it('exposes busy state when loading', () => {
    render(Button, { loading: true, children: kids('Wait') });
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });
});
