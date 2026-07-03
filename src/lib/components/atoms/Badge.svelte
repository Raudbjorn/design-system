<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    tone?: 'neutral' | 'success' | 'error' | 'warning' | 'accent';
    children: Snippet;
  }

  let { tone = 'neutral', children }: Props = $props();
</script>

<span data-sv="badge" data-tone={tone}>{@render children()}</span>

<style>
  [data-sv='badge'] {
    display: inline-flex;
    align-items: center;
    padding: 0.1em 0.55em;
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    line-height: 1.5;
    border-radius: var(--sv-radius-sm);
    border: 1px solid var(--sv-border);
    color: var(--sv-text);
    background: var(--sv-surface-2);
  }
  [data-tone='success'] { color: var(--sv-success); border-color: var(--sv-success); }
  [data-tone='error'] { color: var(--sv-error); border-color: var(--sv-error); }
  [data-tone='warning'] { color: var(--sv-warning); border-color: var(--sv-warning); }
  [data-tone='accent'] { color: var(--sv-accent); border-color: var(--sv-accent); }
</style>
