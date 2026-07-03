<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
    onclick?: (e: MouseEvent) => void;
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    href,
    type = 'button',
    disabled = false,
    loading = false,
    onclick,
    children
  }: Props = $props();
</script>

{#if href}
  <a
    {href}
    data-sv="button"
    data-variant={variant}
    data-size={size}
    aria-disabled={disabled || undefined}
    aria-busy={loading || undefined}
    {onclick}
  >
    {@render children()}
  </a>
{:else}
  <button
    {type}
    data-sv="button"
    data-variant={variant}
    data-size={size}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {onclick}
  >
    {@render children()}
  </button>
{/if}

<style>
  [data-sv='button'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--sv-space-2);
    font-family: var(--sv-font-sans);
    font-weight: var(--sv-font-weight-medium);
    border: 1px solid transparent;
    border-radius: var(--sv-radius-md);
    cursor: pointer;
    text-decoration: none;
    line-height: 1;
    transition: background-color 0.12s ease, border-color 0.12s ease;
  }
  [data-size='sm'] { font-size: var(--sv-fs-sm); padding: var(--sv-space-1) var(--sv-space-3); }
  [data-size='md'] { font-size: var(--sv-fs-base); padding: var(--sv-space-2) var(--sv-space-4); }
  [data-size='lg'] { font-size: var(--sv-fs-lg); padding: var(--sv-space-3) var(--sv-space-6); }

  [data-variant='primary'] { background: var(--sv-accent); color: var(--sv-bg); }
  [data-variant='primary']:hover {
    background: color-mix(in oklab, var(--sv-accent), var(--sv-mix-target) 15%);
  }
  [data-variant='secondary'] { background: var(--sv-accent-2); color: var(--sv-bg); }
  [data-variant='secondary']:hover {
    background: color-mix(in oklab, var(--sv-accent-2), var(--sv-mix-target) 15%);
  }
  [data-variant='ghost'] {
    background: transparent;
    color: var(--sv-text);
    border-color: var(--sv-border);
  }
  [data-variant='ghost']:hover { background: var(--sv-surface-2); }
  [data-variant='danger'] { background: var(--sv-error); color: #fff; }
  [data-variant='danger']:hover {
    background: color-mix(in oklab, var(--sv-error), var(--sv-mix-target) 15%);
  }

  [data-sv='button']:focus-visible {
    outline: 2px solid var(--sv-accent);
    outline-offset: 2px;
  }
  button[disabled] { opacity: 0.5; cursor: not-allowed; }
  [aria-disabled='true'] { opacity: 0.5; pointer-events: none; }
</style>
