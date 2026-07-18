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

  it('leaves the label unchanged when the Clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined
    });
    render(CodeBlock, { code: 'copy me' });
    const button = screen.getByRole('button', { name: /copy/i });

    expect(() => button.click()).not.toThrow();
    await Promise.resolve();
    flushSync();
    expect(button).toHaveTextContent('Copy');
  });

  it('leaves the label unchanged when the clipboard write is rejected', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('permission denied'));
    Object.assign(navigator, { clipboard: { writeText } });
    render(CodeBlock, { code: 'copy me' });
    const button = screen.getByRole('button', { name: /copy/i });

    button.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('copy me'));
    flushSync();
    expect(button).toHaveTextContent('Copy');
  });

  it('restarts the copied window and clears its timer on unmount', async () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(CodeBlock, { code: 'copy me' });
      const button = screen.getByRole('button', { name: /copy/i });

      button.click();
      await vi.waitFor(() => {
        flushSync();
        expect(button).toHaveTextContent('Copied');
      });

      vi.advanceTimersByTime(1000);
      button.click();
      await vi.waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(2));
      await Promise.resolve();
      await Promise.resolve();
      vi.advanceTimersByTime(600);
      flushSync();
      expect(button).toHaveTextContent('Copied');

      unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores a pending clipboard completion after unmount', async () => {
    vi.useFakeTimers();
    let resolveWrite: (() => void) | undefined;
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve;
        })
    );
    Object.assign(navigator, { clipboard: { writeText } });

    try {
      const { unmount } = render(CodeBlock, { code: 'copy me' });
      screen.getByRole('button', { name: /copy/i }).click();
      await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('copy me'));

      unmount();
      resolveWrite?.();
      await Promise.resolve();
      await Promise.resolve();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('accessible name follows the visible label through the copied window', async () => {
    vi.useFakeTimers();
    try {
      render(CodeBlock, { code: 'x', copyLabel: 'Scribe', copiedLabel: 'Scribed!' });
      const button = screen.getByRole('button', { name: 'Scribe' });
      button.click();
      await vi.waitFor(() => {
        flushSync();
        // Visible text and accessible name flip together (label-in-name).
        expect(button).toHaveTextContent('Scribed!');
        expect(button).toHaveAccessibleName('Scribed!');
      });
      vi.advanceTimersByTime(1500);
      flushSync();
      expect(button).toHaveTextContent('Scribe');
      expect(button).toHaveAccessibleName('Scribe');
    } finally {
      vi.useRealTimers();
    }
  });

  it('an explicit copyAriaLabel governs the idle name but yields during the copied window', async () => {
    render(CodeBlock, { code: 'x', copyAriaLabel: 'Copy the incantation' });
    const button = screen.getByRole('button', { name: 'Copy the incantation' });
    button.click();
    await vi.waitFor(() => {
      flushSync();
      expect(button).toHaveAccessibleName('Copied');
    });
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

  it('renders a single-row gutter for single-line code with no trailing newline', () => {
    const { container } = render(CodeBlock, { code: 'const x = 1;', showLineNumbers: true });
    const gutter = container.querySelector('[data-sv="codeblock"] .gutter');
    expect(gutter).not.toBeNull();
    expect([...gutter!.querySelectorAll('li')].map((s) => s.textContent)).toEqual(['1']);
  });

  it('only strips one trailing newline, so extra trailing newlines count as a blank line', () => {
    const { container } = render(CodeBlock, { code: 'a\nb\n\n', showLineNumbers: true });
    const gutter = container.querySelector('[data-sv="codeblock"] .gutter');
    expect([...gutter!.querySelectorAll('li')].map((s) => s.textContent)).toEqual(['1', '2', '3']);
  });

  it('numbers double-digit line counts in order without gaps or duplicates', () => {
    const code = Array.from({ length: 12 }, (_, i) => `line${i + 1}`).join('\n');
    const { container } = render(CodeBlock, { code, showLineNumbers: true });
    const gutter = container.querySelector('[data-sv="codeblock"] .gutter');
    expect([...gutter!.querySelectorAll('li')].map((s) => s.textContent)).toEqual(
      Array.from({ length: 12 }, (_, i) => String(i + 1))
    );
  });

  it('applies the numbered class to the body only when the gutter actually renders', () => {
    const { container } = render(CodeBlock, { code: 'a\nb', showLineNumbers: true });
    expect(container.querySelector('[data-sv="codeblock"] .body')).toHaveClass('numbered');

    const { container: noGutterContainer } = render(CodeBlock, { code: '', showLineNumbers: true });
    expect(noGutterContainer.querySelector('[data-sv="codeblock"] .body')).not.toHaveClass(
      'numbered'
    );
  });

  it('leaves data-numbered false when showLineNumbers is off, even for multi-line code', () => {
    const { container } = render(CodeBlock, { code: 'a\nb\nc' });
    expect(container.querySelector('[data-sv="codeblock"]')).toHaveAttribute(
      'data-numbered',
      'false'
    );
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

  it('does not warn for empty code even when html is non-empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(CodeBlock, { code: '', html: 'stale highlighter output', showLineNumbers: true });
    flushSync();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not warn about line-count mismatch when showLineNumbers is off', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(CodeBlock, { code: 'a\nb', html: 'one line only' });
      flushSync();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
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
