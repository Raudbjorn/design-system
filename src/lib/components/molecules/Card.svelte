<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    padding?: 'sm' | 'md' | 'lg';
    elevated?: boolean;
    header?: Snippet;
    footer?: Snippet;
    children: Snippet;
  }

  let { padding = 'md', elevated = false, header, footer, children }: Props = $props();
</script>

<div data-sv="card" data-padding={padding} data-elevated={elevated}>
  {#if header}<div data-sv="card-header">{@render header()}</div>{/if}
  <div data-sv="card-body">{@render children()}</div>
  {#if footer}<div data-sv="card-footer">{@render footer()}</div>{/if}
</div>

<style>
  [data-sv='card'] {
    background: var(--sv-surface-1);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-lg);
    color: var(--sv-text);
    overflow: hidden;
  }
  [data-elevated='true'] { box-shadow: var(--sv-shadow-md); }
  [data-padding='sm'] [data-sv='card-body'] { padding: var(--sv-space-3); }
  [data-padding='md'] [data-sv='card-body'] { padding: var(--sv-space-4); }
  [data-padding='lg'] [data-sv='card-body'] { padding: var(--sv-space-6); }
  [data-sv='card-header'],
  [data-sv='card-footer'] {
    padding: var(--sv-space-3) var(--sv-space-4);
    background: var(--sv-surface-2);
  }
  [data-sv='card-header'] { border-bottom: 1px solid var(--sv-border); }
  [data-sv='card-footer'] { border-top: 1px solid var(--sv-border); }
</style>
