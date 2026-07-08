import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Timeline from './Timeline.svelte';

describe('Timeline', () => {
  it('defaults to alternate mode with alternating sides', () => {
    const { container } = render(Timeline, {
      items: [{ content: 'A' }, { content: 'B' }]
    });
    expect(container.querySelector('[data-sv="timeline"]')).toHaveAttribute(
      'data-mode',
      'alternate'
    );
    const items = container.querySelectorAll('[data-sv="tl-item"]');
    expect(items[0]).toHaveAttribute('data-side', 'start');
    expect(items[1]).toHaveAttribute('data-side', 'end');
  });
});
