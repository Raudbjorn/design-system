<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    direction?: 'column' | 'row';
    gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12;
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between';
    wrap?: boolean;
    children: Snippet;
  }

  let {
    direction = 'column',
    gap = 4,
    align = 'stretch',
    justify = 'start',
    wrap = false,
    children
  }: Props = $props();

  const map = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', between: 'space-between' } as const;
</script>

<div
  data-sv="stack"
  data-direction={direction}
  style:display="flex"
  style:flex-direction={direction}
  style:gap={`var(--sv-space-${gap})`}
  style:align-items={map[align]}
  style:justify-content={map[justify]}
  style:flex-wrap={wrap ? 'wrap' : 'nowrap'}
>
  {@render children()}
</div>

<style>
  [data-sv='stack'] { display: flex; }
</style>
