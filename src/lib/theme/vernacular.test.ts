import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import CodeBlock from '../components/molecules/CodeBlock.svelte';
import NavBar from '../components/molecules/NavBar.svelte';
import type { Vernacular } from './vernacular';

const snip = (t: string) => createRawSnippet(() => ({ render: () => `<a href="/">${t}</a>` }));

describe('Vernacular', () => {
  const v: Vernacular = {
    codeBlock: { copyLabel: 'Transcribe' },
    navBar: { menuLabel: 'Waypoints' }
  };

  it('spread into CodeBlock, the catalog label becomes both the visible copy-button text and its accessible name', () => {
    render(CodeBlock, { code: 'x', ...v.codeBlock });
    const button = screen.getByRole('button', { name: 'Transcribe' });
    expect(button).toHaveTextContent('Transcribe');
    expect(button).toHaveAttribute('aria-label', 'Transcribe');
  });

  it('spread into NavBar, the catalog label names the menu toggle', () => {
    render(NavBar, { children: snip('Home'), ...v.navBar });
    const toggle = screen.getByRole('button', { name: 'Waypoints' });
    expect(toggle).toHaveAttribute('aria-label', 'Waypoints');
  });
});
