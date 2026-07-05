import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Stack from './Stack.svelte';

const kids = createRawSnippet(() => ({ render: () => `<div>child</div>` }));

const getStack = (container: HTMLElement) =>
  container.querySelector('[data-sv="stack"]') as HTMLElement;

describe('Stack', () => {
  it('is a column flex container by default', () => {
    const { container } = render(Stack, { children: kids });
    const el = getStack(container);
    expect(el).toHaveStyle({ display: 'flex' });
    expect(el).toHaveAttribute('data-direction', 'column');
    expect(el.style.getPropertyValue('flex-wrap')).toBe('nowrap');
  });

  it.each([0, 1, 2, 3, 4, 6, 8, 12] as const)('maps gap %i to its spacing token', (gap) => {
    const { container } = render(Stack, { gap, children: kids });
    expect(getStack(container).style.getPropertyValue('gap')).toBe(`var(--sv-space-${gap})`);
  });

  it('renders a row with the matching data attribute', () => {
    const { container } = render(Stack, { direction: 'row', children: kids });
    const el = getStack(container);
    expect(el).toHaveAttribute('data-direction', 'row');
    expect(el.style.getPropertyValue('flex-direction')).toBe('row');
  });

  it.each([
    ['start', 'flex-start'],
    ['center', 'center'],
    ['end', 'flex-end'],
    ['stretch', 'stretch'],
    ['baseline', 'baseline']
  ] as const)('maps align %s to align-items %s', (align, expected) => {
    const { container } = render(Stack, { align, children: kids });
    expect(getStack(container).style.getPropertyValue('align-items')).toBe(expected);
  });

  it.each([
    ['start', 'flex-start'],
    ['center', 'center'],
    ['end', 'flex-end'],
    ['between', 'space-between']
  ] as const)('maps justify %s to justify-content %s', (justify, expected) => {
    const { container } = render(Stack, { justify, children: kids });
    expect(getStack(container).style.getPropertyValue('justify-content')).toBe(expected);
  });

  it('wraps only when asked', () => {
    const { container } = render(Stack, { wrap: true, children: kids });
    expect(getStack(container).style.getPropertyValue('flex-wrap')).toBe('wrap');
  });

  it.each([
    [undefined, 'DIV'],
    ['ul', 'UL'],
    ['nav', 'NAV']
  ] as const)('renders as=%s as a %s element', (as, tagName) => {
    const { container } = render(Stack, { ...(as ? { as } : {}), children: kids });
    const el = getStack(container);
    expect(el.tagName).toBe(tagName);
    expect(el).toHaveAttribute('data-sv', 'stack');
  });

  it('passes arbitrary attributes through', () => {
    const { container } = render(Stack, {
      class: 'toolbar',
      id: 'svc',
      role: 'list',
      'aria-label': 'services',
      'data-testid': 'row',
      children: kids
    });
    const el = getStack(container);
    expect(el.classList.contains('toolbar')).toBe(true);
    expect(el).toHaveAttribute('id', 'svc');
    expect(el).toHaveAttribute('role', 'list');
    expect(el).toHaveAttribute('aria-label', 'services');
    expect(el).toHaveAttribute('data-testid', 'row');
  });

  it('lets consumer style through but never a colliding flex property', () => {
    const { container } = render(Stack, { style: 'gap: 9px; padding: 2rem', children: kids });
    const el = getStack(container);
    expect(el.style.getPropertyValue('gap')).toBe('var(--sv-space-4)');
    expect(el.style.getPropertyValue('padding')).toBe('2rem');
  });

  it('keeps the data-sv contract over a consumer collision', () => {
    const { container } = render(Stack, { 'data-sv': 'nope', children: kids });
    expect(container.querySelector('[data-sv="stack"]')).not.toBeNull();
    expect(container.querySelector('[data-sv="nope"]')).toBeNull();
  });
});
