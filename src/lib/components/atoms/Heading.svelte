<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    level?: 1 | 2 | 3 | 4;
    children: Snippet;
  }

  let { level = 1, children }: Props = $props();
  const tag = $derived(`h${level}` as const);
</script>

<svelte:element this={tag} data-sv="heading" data-level={level}>
  {@render children()}
</svelte:element>

<style>
  [data-sv='heading'] {
    margin: 0;
    font-family: var(--sv-font-sans);
    color: var(--sv-text-strong);
    line-height: var(--sv-lh-tight);
    font-weight: var(--sv-font-weight-bold);
  }
  [data-level='1'] { font-size: var(--sv-fs-3xl); }
  [data-level='2'] { font-size: var(--sv-fs-2xl); }
  [data-level='3'] { font-size: var(--sv-fs-xl); }
  [data-level='4'] { font-size: var(--sv-fs-lg); }
</style>
