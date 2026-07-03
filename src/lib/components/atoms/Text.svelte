<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    size?: 'xs' | 'sm' | 'base' | 'lg';
    tone?: 'default' | 'strong' | 'muted' | 'faint';
    mono?: boolean;
    as?: 'p' | 'span' | 'div';
    children: Snippet;
  }

  let { size = 'base', tone = 'default', mono = false, as = 'p', children }: Props = $props();
</script>

<svelte:element
  this={as}
  data-sv="text"
  data-size={size}
  data-tone={tone}
  class:mono
>
  {@render children()}
</svelte:element>

<style>
  [data-sv='text'] {
    margin: 0;
    font-family: var(--sv-font-sans);
    line-height: var(--sv-lh-normal);
    color: var(--sv-text);
  }
  .mono { font-family: var(--sv-font-mono); }
  [data-size='xs'] { font-size: var(--sv-fs-xs); }
  [data-size='sm'] { font-size: var(--sv-fs-sm); }
  [data-size='base'] { font-size: var(--sv-fs-base); }
  [data-size='lg'] { font-size: var(--sv-fs-lg); }
  [data-tone='strong'] { color: var(--sv-text-strong); }
  [data-tone='muted'] { color: var(--sv-text-muted); }
  [data-tone='faint'] { color: var(--sv-text-faint); }
</style>
