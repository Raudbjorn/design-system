<!--
  Layout primitive — reimplements main-branch's Stack.svelte structure (same
  direction/gap/align/justify/wrap props and `map` lookup), substituting
  `gap` values against --layform-space-{0,1,2,3,4,6,8,12} (Pattern 93's base
  spacing unit, see /home/svnbjrn/dev/layform/assets/7.6-scale.md) instead of
  --sv-space-*, and narrowing the `gap` prop type to exactly the steps Phase
  0 defined.
-->
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

  const map = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    between: 'space-between'
  } as const;
</script>

<div
  data-sv="stack"
  data-direction={direction}
  style:display="flex"
  style:flex-direction={direction}
  style:gap={`var(--layform-space-${gap})`}
  style:align-items={map[align]}
  style:justify-content={map[justify]}
  style:flex-wrap={wrap ? 'wrap' : 'nowrap'}
>
  {@render children()}
</div>

<style>
  [data-sv='stack'] {
    display: flex;
  }
</style>
