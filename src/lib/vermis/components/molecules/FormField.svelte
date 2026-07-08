<!--
  Implements layform Pattern 70 (Form Field as a Reference-Zone Container).
  See patterns/02-component-patterns.md.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div data-sv="form-field">
  {@render children()}
</div>

<style>
  /* Deliberately --layform-radius-none, never --layform-radius-panel — a
     form field must stay visually distinct from Pattern 65's rounded
     image frames, per this pattern's own differentiation rule. */
  [data-sv='form-field'] {
    display: inline-flex;
    border: var(--layform-border-thin) solid var(--layform-ink);
    border-radius: var(--layform-radius-none);
    padding: var(--layform-space-1) var(--layform-space-2);
    background: var(--layform-parchment-1);
  }
  [data-sv='form-field']:focus-within {
    outline: var(--layform-border-thin) solid var(--layform-accent);
    outline-offset: 2px;
  }
  [data-sv='form-field'] :global(input),
  [data-sv='form-field'] :global(select),
  [data-sv='form-field'] :global(textarea) {
    border: none;
    background: transparent;
    font-family: var(--layform-font-reading);
    color: var(--layform-ink);
    width: 100%;
  }
</style>
