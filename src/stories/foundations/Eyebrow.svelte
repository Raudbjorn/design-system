<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<h3 class="eyebrow">{@render children()}</h3>

<style>
  .eyebrow {
    margin: 0 0 var(--sv-space-4);
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    font-weight: var(--sv-font-weight-normal);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--sv-text-muted);
  }
</style>
