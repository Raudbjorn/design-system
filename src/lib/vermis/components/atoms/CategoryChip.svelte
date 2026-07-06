<!--
  Implements layform Pattern 61 (Category / Taxonomy Chip Component).
  See patterns/02-component-patterns.md.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    pressed?: boolean;
  }

  let { children, pressed = false }: Props = $props();
</script>

<span data-sv="category-chip" data-pressed={pressed} aria-pressed={pressed}>
  {@render children()}
</span>

<style>
  /* Thinner border than StatusTag's --layform-border-thin, ranking a
     taxonomy chip visually below lifecycle-status information. */
  [data-sv='category-chip'] {
    display: inline-block;
    border: var(--layform-border-hairline) solid var(--layform-ink);
    border-radius: var(--layform-radius-panel);
    padding: 0.125em 0.75em;
    font-family: var(--layform-font-reading);
    font-size: 0.8125rem;
    color: var(--layform-ink);
    cursor: default;
  }
  [data-pressed='true'] {
    background: var(--layform-accent-secondary);
    color: var(--layform-parchment-1);
  }
</style>
