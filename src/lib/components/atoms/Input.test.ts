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

  it('generates a label association and forwards native attributes', () => {
    const { container } = render(Input, {
      label: 'Host',
      hint: 'FQDN',
      name: 'host',
      required: true
    });
    const input = container.querySelector<HTMLInputElement>('[data-sv="input"]');
    const label = container.querySelector('label');
    expect(input?.id).toMatch(/^sv-input-/);
    expect(label).toHaveAttribute('for', input?.id);
    expect(input).toHaveAttribute('name', 'host');
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-describedby', `${input?.id}-desc`);
  });

  it('composes caller and generated descriptions', () => {
    const { container } = render(Input, {
      id: 'host',
      hint: 'Fully qualified domain name',
      'aria-describedby': 'external-help'
    });
    expect(container.querySelector('[data-sv="input"]')).toHaveAttribute(
      'aria-describedby',
      'external-help host-desc'
    );
  });
});
