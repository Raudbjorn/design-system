import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Badge from './Badge.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Badge', () => {
  it('defaults to neutral tone', () => {
    render(Badge, { children: kids('new') });
    expect(screen.getByText('new').closest('[data-sv="badge"]')).toHaveAttribute(
      'data-tone',
      'neutral'
    );
  });
  it('applies the requested tone', () => {
    render(Badge, { tone: 'success', children: kids('ok') });
    expect(screen.getByText('ok').closest('[data-sv="badge"]')).toHaveAttribute(
      'data-tone',
      'success'
    );
  });
});
