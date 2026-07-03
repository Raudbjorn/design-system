import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Avatar from './Avatar.svelte';

describe('Avatar', () => {
  it('renders an img when src is provided', () => {
    render(Avatar, { src: '/p.jpg', alt: 'Sve' });
    expect(screen.getByRole('img', { name: 'Sve' })).toHaveAttribute('src', '/p.jpg');
  });
  it('falls back to initials from alt', () => {
    render(Avatar, { alt: 'Sveinbjörn Geirsson' });
    const el = screen.getByRole('img', { name: 'Sveinbjörn Geirsson' });
    expect(el).toHaveTextContent('SG');
  });
});
