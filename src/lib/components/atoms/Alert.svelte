<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    tone?: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    /** Glyph override; defaults to a tone-appropriate mark. */
    icon?: string;
    children: Snippet;
  }

  let { tone = 'info', title, icon, children }: Props = $props();

  const marks = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕' } as const;
  const mark = $derived(icon ?? marks[tone]);
</script>

<div
  data-sv="alert"
  data-tone={tone}
  role={tone === 'error' || tone === 'warning' ? 'alert' : 'status'}
>
  <span data-sv="alert-icon" aria-hidden="true">{mark}</span>
  <div data-sv="alert-body">
    {#if title}<span data-sv="alert-title">{title}</span>{/if}
    <span data-sv="alert-text">{@render children()}</span>
  </div>
</div>

<style>
  [data-sv='alert'] {
    display: flex;
    gap: var(--sv-space-3);
    align-items: flex-start;
    padding: var(--sv-space-3) var(--sv-space-4);
    border-radius: var(--sv-radius-md);
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text);
    background: color-mix(in oklab, var(--tone), var(--sv-surface-1) 88%);
    border: 1px solid color-mix(in oklab, var(--tone), transparent 60%);
    border-left: 3px solid var(--tone);
  }
  [data-tone='info'] { --tone: var(--sv-accent); }
  [data-tone='success'] { --tone: var(--sv-success); }
  [data-tone='warning'] { --tone: var(--sv-warning); }
  [data-tone='error'] { --tone: var(--sv-error); }
  [data-sv='alert-icon'] {
    color: var(--tone);
    font-family: var(--sv-font-mono);
    line-height: var(--sv-lh-normal);
  }
  [data-sv='alert-body'] { display: flex; flex-direction: column; gap: 2px; }
  [data-sv='alert-title'] { color: var(--sv-text-strong); font-weight: var(--sv-font-weight-semibold); }
</style>
