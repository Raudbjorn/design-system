<!--
  Implements layform Pattern 60 (Status Tag Component).
  See patterns/02-component-patterns.md.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    status: 'draft' | 'deprecated';
    children: Snippet;
  }

  let { status, children }: Props = $props();

  const fill: Record<'draft' | 'deprecated', string> = {
    draft: 'var(--layform-status-draft)',
    deprecated: 'var(--layform-status-deprecated)'
  };
</script>

<span data-sv="status-tag" data-status={status} style:background={fill[status]}>
  {@render children()}
</span>

<style>
  /* Reuses document-tier Pattern 4's default rounded-rectangle panel
     shape, sized to content — never Pattern 29's fixed-diameter circle. */
  [data-sv='status-tag'] {
    display: inline-block;
    border-radius: var(--layform-radius-panel);
    padding: 0.125em 0.75em;
    font-family: var(--layform-font-reading);
    font-size: 0.8125rem;
    font-weight: var(--layform-weight-reading-body);
    color: var(--layform-parchment-1);
  }
</style>
