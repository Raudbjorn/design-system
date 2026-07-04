import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import CodeBlock from './CodeBlock.svelte';

describe('CodeBlock', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
  });

  it('renders plain code when no html provided', () => {
    render(CodeBlock, { code: 'const x = 1;' });
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('shows a filename header when given', () => {
    render(CodeBlock, { code: 'x', filename: 'app.ts' });
    expect(screen.getByText('app.ts')).toBeInTheDocument();
  });

  it('copies the code source on copy click', async () => {
    render(CodeBlock, { code: 'copy me' });
    screen.getByRole('button', { name: /copy/i }).click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy me');
  });

  it('renders no gutter by default', () => {
    const { container } = render(CodeBlock, { code: 'a\nb' });
    expect(container.querySelector('[data-sv="codeblock"] .gutter')).toBeNull();
  });

  it('renders an aria-hidden line-number gutter when showLineNumbers is set', () => {
    const { container } = render(CodeBlock, { code: 'a\nb\nc', showLineNumbers: true });
    const gutter = container.querySelector('[data-sv="codeblock"] .gutter');
    expect(gutter).not.toBeNull();
    expect(gutter).toHaveAttribute('aria-hidden', 'true');
    expect([...gutter!.querySelectorAll('li')].map((s) => s.textContent)).toEqual([
      '1',
      '2',
      '3'
    ]);
  });

  it('ignores a single trailing newline when numbering', () => {
    const { container } = render(CodeBlock, { code: 'a\nb\n', showLineNumbers: true });
    expect(container.querySelectorAll('.gutter li')).toHaveLength(2);
  });

  it('renders no gutter for empty code even when showLineNumbers is set', () => {
    const { container } = render(CodeBlock, { code: '', showLineNumbers: true });
    expect(container.querySelector('[data-sv="codeblock"] .gutter')).toBeNull();
  });

  it('data-numbered matches the actual gutter state, not the raw prop', () => {
    const withGutter = render(CodeBlock, { code: 'a\nb', showLineNumbers: true });
    expect(withGutter.container.querySelector('[data-sv="codeblock"]')).toHaveAttribute(
      'data-numbered',
      'true'
    );
    // empty code renders no gutter, so the attribute must not claim otherwise
    const noGutter = render(CodeBlock, { code: '', showLineNumbers: true });
    expect(noGutter.container.querySelector('[data-sv="codeblock"]')).toHaveAttribute(
      'data-numbered',
      'false'
    );
  });

  it('counts CRLF line endings correctly', () => {
    const { container } = render(CodeBlock, { code: 'a\r\nb\r\n', showLineNumbers: true });
    expect(container.querySelectorAll('.gutter li')).toHaveLength(2);
  });

  it('warns in dev only when a numbered html block breaks line parity with code', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(CodeBlock, { code: 'a\nb', html: 'a\nb', showLineNumbers: true });
    flushSync();
    expect(warn).not.toHaveBeenCalled();
    render(CodeBlock, { code: 'a\nb', html: 'one line only', showLineNumbers: true });
    flushSync();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('copies only the code source when the gutter is shown', () => {
    render(CodeBlock, { code: 'a\nb', showLineNumbers: true });
    screen.getByRole('button', { name: /copy/i }).click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('a\nb');
  });

  it('renders tokenized html and still copies the code source, not the html', () => {
    const { container } = render(CodeBlock, {
      code: 'const x',
      html: '<span class="tok-keyword">const</span> x'
    });

    const token = container.querySelector('[data-sv="codeblock"] .tok-keyword');
    expect(token).not.toBeNull();
    expect(token).toHaveTextContent('const');

    screen.getByRole('button', { name: /copy/i }).click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x');
  });
});
