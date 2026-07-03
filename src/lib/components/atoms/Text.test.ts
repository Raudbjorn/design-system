import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Text from './Text.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Text', () => {
  it('renders children in a <p> by default', () => {
    render(Text, { children: kids('hello') });
    const el = screen.getByText('hello').closest('p');
    expect(el).toBeInTheDocument();
  });

  it('applies tone + size data attributes', () => {
    render(Text, { tone: 'muted', size: 'sm', children: kids('meta') });
    const el = screen.getByText('meta').closest('[data-sv="text"]');
    expect(el).toHaveAttribute('data-tone', 'muted');
    expect(el).toHaveAttribute('data-size', 'sm');
  });
});
