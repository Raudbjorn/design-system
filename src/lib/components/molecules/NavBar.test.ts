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
  it('gives each instance a unique aria-controls id', () => {
    render(NavBar, { children: snip('Home') });
    render(NavBar, { children: snip('About') });
    const toggles = screen.getAllByRole('button', { name: /menu/i });
    expect(toggles).toHaveLength(2);
    const [a, b] = toggles;
    const idA = a?.getAttribute('aria-controls');
    const idB = b?.getAttribute('aria-controls');
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idA).not.toBe(idB);
    expect(document.getElementById(idA as string)).not.toBeNull();
    expect(document.getElementById(idB as string)).not.toBeNull();
  });
});
