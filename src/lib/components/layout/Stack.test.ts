import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Stack from './Stack.svelte';

const kids = createRawSnippet(() => ({ render: () => `<div>child</div>` }));

describe('Stack', () => {
  it('is a column flex container by default', () => {
    const { container } = render(Stack, { children: kids });
    const el = container.querySelector('[data-sv="stack"]') as HTMLElement;
    expect(el).toHaveStyle({ display: 'flex' });
    expect(el).toHaveAttribute('data-direction', 'column');
  });
  it('maps gap to the spacing token', () => {
    const { container } = render(Stack, { gap: 4, children: kids });
    const el = container.querySelector('[data-sv="stack"]') as HTMLElement;
    expect(el.style.getPropertyValue('gap')).toBe('var(--sv-space-4)');
  });
});
