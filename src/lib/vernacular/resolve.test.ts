import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { parseVernacular } from './parse';
import { resolveVernacular } from './resolve';
import type { VernacularCatalog } from './types';
import CodeBlock from '../components/molecules/CodeBlock.svelte';
import NavBar from '../components/molecules/NavBar.svelte';

const catalog = (strings: Record<string, unknown>): VernacularCatalog => {
  const r = parseVernacular({ name: 'w', version: '1.0.0', strings });
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
};

describe('resolveVernacular', () => {
  it('places present overrides and omits absent keys (world → English fallback)', () => {
    const v = resolveVernacular(catalog({ 'codeBlock.copyLabel': 'Transcribe' }));
    expect(v.codeBlock).toEqual({ copyLabel: 'Transcribe' });
    // navBar untouched → absent → components render their English defaults.
    expect(v.navBar).toBeUndefined();
  });

  it('plainLanguage forces English everywhere (returns {})', () => {
    const v = resolveVernacular(catalog({ 'navBar.menuLabel': 'Waypoints' }), { plainLanguage: true });
    expect(v).toEqual({});
  });

  it('a null catalog resolves to {}', () => {
    expect(resolveVernacular(null)).toEqual({});
  });

  it('spreads into CodeBlock, setting both the visible label and the accessible name', () => {
    const v = resolveVernacular(catalog({ 'codeBlock.copyLabel': 'Transcribe' }));
    const { getByRole } = render(CodeBlock, { props: { code: 'x', ...v.codeBlock } });
    const button = getByRole('button');
    expect(button).toHaveTextContent('Transcribe');
    expect(button).toHaveAttribute('aria-label', 'Transcribe');
  });

  it('spreads into NavBar, naming the menu toggle', () => {
    const v = resolveVernacular(catalog({ 'navBar.menuLabel': 'Waypoints' }));
    const children = createRawSnippet(() => ({ render: () => '<a href="/">Home</a>' }));
    const { getByLabelText } = render(NavBar, { props: { children, ...v.navBar } });
    expect(getByLabelText('Waypoints')).toBeInTheDocument();
  });
});
