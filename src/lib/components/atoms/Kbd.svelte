<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<kbd data-sv="kbd">{@render children()}</kbd>

<style>
  [data-sv='kbd'] {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    padding: 0.1em 0.4em;
    border: 1px solid var(--sv-border);
    border-bottom-width: 2px;
    border-radius: var(--sv-radius-sm);
    background: var(--sv-surface-3);
    color: var(--sv-text-strong);
  }
</style>
