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

  it('uses ordered-list semantics and names loading state', () => {
    const { container } = render(Timeline, {
      items: [{ content: 'Deploying', title: 'Release', loading: true }]
    });
    expect(container.querySelector('ol[data-sv="timeline"]')).toBeTruthy();
    expect(container.querySelector('ol[data-sv="timeline"]')).toHaveAttribute('role', 'list');
    expect(container.querySelectorAll('li[data-sv="tl-item"]')).toHaveLength(1);
    expect(container.querySelector('[role="status"]')).toHaveAccessibleName('Loading Release');
  });
});
