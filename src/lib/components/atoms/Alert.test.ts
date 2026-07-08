import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Alert from './Alert.svelte';

describe('Alert', () => {
  it('uses assertive role for the error tone', () => {
    const { container } = render(Alert, {
      tone: 'error',
      children: createRawSnippet(() => ({ render: () => '<span>x</span>' }))
    });
    const el = container.querySelector('[data-sv="alert"]');
    expect(el).toHaveAttribute('data-tone', 'error');
    expect(el).toHaveAttribute('role', 'alert');
  });
});
