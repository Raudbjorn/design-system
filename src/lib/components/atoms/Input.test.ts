import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Input from './Input.svelte';

describe('Input', () => {
  it('wires error state to aria + describedby', () => {
    const { container } = render(Input, { id: 'e', error: 'Bad' });
    const input = container.querySelector('[data-sv="input"]');
    expect(input).toHaveAttribute('data-error', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'e-desc');
    expect(container.querySelector('#e-desc')).toHaveTextContent('Bad');
  });
});
