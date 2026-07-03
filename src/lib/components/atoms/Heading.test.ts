import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Heading from './Heading.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Heading', () => {
  it('renders an h2 for level 2', () => {
    render(Heading, { level: 2, children: kids('Title') });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Title');
  });
  it('defaults to h1', () => {
    render(Heading, { children: kids('Top') });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
