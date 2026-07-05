<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  // HTMLAttributes carries an implicit optional `children`; omit it so the
  // snippet stays required.
  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** Semantic element for the flex container. Lists lose their chrome. */
    as?:
      | 'div'
      | 'section'
      | 'article'
      | 'nav'
      | 'header'
      | 'footer'
      | 'main'
      | 'aside'
      | 'form'
      | 'ul'
      | 'ol';
    direction?: 'column' | 'row';
    gap?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12;
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
    justify?: 'start' | 'center' | 'end' | 'between';
    wrap?: boolean;
    children: Snippet;
  }

  let {
    as = 'div',
    direction = 'column',
    gap = 4,
    align = 'stretch',
    justify = 'start',
    wrap = false,
    children,
    ...rest
  }: Props = $props();

  const map = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
    between: 'space-between',
    baseline: 'baseline'
  } as const;
</script>

<!-- rest spreads first: the data-sv contract and the style: directives below
     always win over colliding consumer attributes. -->
<svelte:element
  this={as}
  {...rest}
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
</svelte:element>

<style>
  [data-sv='stack'] {
    display: flex;
  }
  /* List semantics without list chrome. */
  :where(ul, ol)[data-sv='stack'] {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
