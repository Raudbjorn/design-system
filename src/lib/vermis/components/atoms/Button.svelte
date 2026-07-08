<!--
  Implements layform Pattern 68 (Interactive Button — Bordered Affordance
  Without a Source Analog), Pattern 69 (Focus and Pressed-State Signaling),
  Pattern 84 (Hover Color-Shift Step Size — One Fixed Perceptual Delta),
  Pattern 54 (Callout / Inscription Box — reused only for the `callout`
  variant's border-only vocabulary, shared with Card.svelte's own
  `variant="callout"`, not for the aside-box anatomy itself).
  See patterns/{02-component,03-element}-patterns.md.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'callout';
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

  const inert = $derived(disabled || loading);
</script>

{#if href}
  <a
    href={inert ? undefined : href}
    data-sv="button"
    data-variant={variant}
    data-size={size}
    aria-disabled={inert || undefined}
    aria-busy={loading || undefined}
    tabindex={inert ? -1 : undefined}
    onclick={(e) => {
      if (inert) {
        e.preventDefault();
        return;
      }
      onclick?.(e);
    }}
  >
    {@render children()}
  </a>
{:else}
  <button
    {type}
    data-sv="button"
    data-variant={variant}
    data-size={size}
    disabled={inert}
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
    gap: var(--layform-space-1);
    font-family: var(--layform-font-display);
    font-weight: var(--layform-weight-display-h4);
    border: 1px solid transparent;
    border-radius: var(--layform-radius-panel);
    cursor: pointer;
    text-decoration: none;
    line-height: 1;
    transition:
      background-color 0.12s ease,
      color 0.12s ease,
      border-color 0.12s ease,
      box-shadow 0.12s ease;
  }
  [data-size='sm'] {
    font-size: 1em;
    padding: var(--layform-space-1) var(--layform-space-3);
  }
  [data-size='md'] {
    font-size: 1.125em;
    padding: var(--layform-space-2) var(--layform-space-4);
  }
  [data-size='lg'] {
    font-size: 1.25em;
    padding: var(--layform-space-3) var(--layform-space-6);
  }

  [data-variant='primary'] {
    background: var(--layform-accent);
    color: var(--layform-parchment-1);
  }
  [data-variant='primary']:hover {
    background: color-mix(in oklab, var(--layform-accent), var(--layform-ink) 10%);
  }
  [data-variant='callout'] {
    background: transparent;
    color: var(--layform-accent);
    border-color: var(--layform-accent);
  }
  [data-variant='callout']:hover {
    color: color-mix(in oklab, var(--layform-accent), var(--layform-ink) 10%);
    border-color: color-mix(in oklab, var(--layform-accent), var(--layform-ink) 10%);
  }

  [data-sv='button']:focus-visible {
    outline: var(--layform-border-thin) solid var(--layform-accent);
    outline-offset: 2px;
  }
  [data-sv='button']:active {
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
  }
  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  [aria-disabled='true'] {
    opacity: 0.5;
    pointer-events: none;
  }
</style>
