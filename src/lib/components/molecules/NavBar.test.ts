import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import NavBar from './NavBar.svelte';

const snip = (t: string) =>
  createRawSnippet(() => ({ render: () => `<a href="/">${t}</a>` }));

describe('NavBar', () => {
  it('exposes a primary navigation landmark', () => {
    render(NavBar, { children: snip('Home') });
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });
  it('toggle button flips aria-expanded', async () => {
    render(NavBar, { children: snip('Home') });
    const toggle = screen.getByRole('button', { name: /menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    toggle.click();
    await Promise.resolve();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
