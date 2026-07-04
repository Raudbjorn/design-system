import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Kbd from './Kbd.svelte';

const kids = (t: string) =>
  createRawSnippet(() => ({ render: () => `<span>${t}</span>` }));

describe('Kbd', () => {
  it('renders a <kbd> element', () => {
    const { container } = render(Kbd, { children: kids('Esc') });
    const el = container.querySelector('kbd');
    expect(el).toHaveTextContent('Esc');
    expect(el).toHaveAttribute('data-sv', 'kbd');
  });
});
