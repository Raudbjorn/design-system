import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Card from './Card.svelte';

const snip = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Card', () => {
  it('renders body content', () => {
    render(Card, { children: snip('body') });
    expect(screen.getByText('body').closest('[data-sv="card"]')).toBeInTheDocument();
  });
  it('renders header and footer when provided', () => {
    render(Card, { header: snip('H'), footer: snip('F'), children: snip('B') });
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });
  it('sets elevated flag', () => {
    render(Card, { elevated: true, children: snip('B') });
    expect(screen.getByText('B').closest('[data-sv="card"]')).toHaveAttribute(
      'data-elevated',
      'true'
    );
  });
});
