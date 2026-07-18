import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Select from './Select.svelte';

describe('Select', () => {
  it('renders options', () => {
    const { container } = render(Select, {
      options: [{ value: 'a', label: 'A' }],
      value: 'a'
    });
    expect(container.querySelector('[data-sv="select"]')).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('generates a label association, forwards attributes, and selects the first option', async () => {
    const { container } = render(Select, {
      label: 'Host',
      name: 'host',
      required: true,
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' }
      ]
    });
    const select = container.querySelector<HTMLSelectElement>('[data-sv="select"]');
    const label = container.querySelector('label');
    expect(select?.id).toMatch(/^sv-select-/);
    expect(label).toHaveAttribute('for', select?.id);
    expect(select).toHaveAttribute('name', 'host');
    expect(select).toBeRequired();
    expect(select).toHaveValue('a');
  });
});
