import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Link from './Link.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Link', () => {
  it('renders an anchor with href', () => {
    render(Link, { href: '/a', children: kids('home') });
    expect(screen.getByRole('link', { name: /home/ })).toHaveAttribute('href', '/a');
  });
  it('marks external links safely', () => {
    render(Link, { href: 'https://x.io', external: true, children: kids('out') });
    const a = screen.getByRole('link', { name: /out/ });
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
