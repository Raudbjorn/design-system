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
});
