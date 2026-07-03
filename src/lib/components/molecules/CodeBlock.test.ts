import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
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
});
