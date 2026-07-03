import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatCard from './StatCard.svelte';

describe('StatCard', () => {
  it('renders value and label', () => {
    render(StatCard, { value: '128', label: 'Deploys' });
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Deploys')).toBeInTheDocument();
  });
  it('applies tone', () => {
    render(StatCard, { value: '9', label: 'x', tone: 'accent-2' });
    expect(screen.getByText('9').closest('[data-sv="statcard"]')).toHaveAttribute(
      'data-tone',
      'accent-2'
    );
  });
});
