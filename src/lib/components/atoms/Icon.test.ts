import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Icon from './Icon.svelte';

describe('Icon', () => {
  it('is decorative (aria-hidden) without a label', () => {
    const { container } = render(Icon, { glyph: '' });
    const el = container.querySelector('[data-sv="icon"]');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });
  it('is a labeled img with a label', () => {
    render(Icon, { glyph: '', label: 'home' });
    const el = screen.getByRole('img', { name: 'home' });
    expect(el).toHaveAttribute('data-sv', 'icon');
  });
});
