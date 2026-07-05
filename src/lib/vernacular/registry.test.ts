import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { VERNACULAR_REGISTRY } from './registry';
import CodeBlock from '../components/molecules/CodeBlock.svelte';
import NavBar from '../components/molecules/NavBar.svelte';

const spec = (key: string) => {
  const s = VERNACULAR_REGISTRY.get(key);
  if (!s) throw new Error(`missing registry key ${key}`);
  return s;
};

describe('VERNACULAR_REGISTRY', () => {
  it('covers exactly the five Vernacular leaves', () => {
    expect([...VERNACULAR_REGISTRY.keys()].sort()).toEqual([
      'codeBlock.copiedLabel',
      'codeBlock.copyAriaLabel',
      'codeBlock.copyLabel',
      'navBar.menuLabel',
      'navBar.navLabel'
    ]);
  });

  it('every current slot is a fixed label (no placeholders) with a sane length cap', () => {
    for (const s of VERNACULAR_REGISTRY.values()) {
      expect(s.placeholders).toEqual([]);
      expect(s.maxLen).toBeGreaterThan(0);
      expect(s.plainDefault.length).toBeLessThanOrEqual(s.maxLen);
    }
  });

  // Lockstep: plainDefault MUST equal what the component renders with no props,
  // so the fallback + plain-language paths stay truthful as components evolve.
  it("plainDefault matches CodeBlock's rendered defaults", () => {
    const { getByRole } = render(CodeBlock, { props: { code: 'x' } });
    const button = getByRole('button');
    expect(button).toHaveTextContent(spec('codeBlock.copyLabel').plainDefault); // 'Copy'
    expect(button).toHaveAttribute('aria-label', spec('codeBlock.copyAriaLabel').plainDefault); // 'Copy code'
    // copiedLabel is the post-copy state (not statically rendered); pinned here.
    expect(spec('codeBlock.copiedLabel').plainDefault).toBe('Copied');
  });

  it("plainDefault matches NavBar's rendered defaults", () => {
    const children = createRawSnippet(() => ({ render: () => '<a href="/">Home</a>' }));
    const { getByLabelText } = render(NavBar, { props: { children } });
    expect(getByLabelText(spec('navBar.navLabel').plainDefault)).toBeInTheDocument(); // 'Primary'
    expect(getByLabelText(spec('navBar.menuLabel').plainDefault)).toBeInTheDocument(); // 'Menu'
  });
});
