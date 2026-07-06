<!--
  Implements layform Pattern 73 (The Four-Step Heading Ladder), Pattern 74
  (Kicker/All-Caps Label Tracking Formula).
  See patterns/03-element-patterns.md.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    level: 1 | 2 | 3 | 4;
    kicker?: boolean;
    children: Snippet;
  }

  let { level, kicker = false, children }: Props = $props();
</script>

<svelte:element this={`h${level}`} data-sv="heading" data-level={level} data-kicker={kicker}>
  {@render children()}
</svelte:element>

<style>
  [data-sv='heading'] {
    margin: 0;
    font-family: var(--layform-font-display);
    line-height: var(--layform-line-height-display, 1.15);
  }
  [data-sv='heading'][data-level='1'] {
    font-size: var(--layform-heading-1-size);
    font-weight: var(--layform-heading-1-weight);
    letter-spacing: var(--layform-heading-1-tracking);
  }
  [data-sv='heading'][data-level='2'] {
    font-size: var(--layform-heading-2-size);
    font-weight: var(--layform-heading-2-weight);
    letter-spacing: var(--layform-heading-2-tracking);
  }
  [data-sv='heading'][data-level='3'] {
    font-size: var(--layform-heading-3-size);
    font-weight: var(--layform-heading-3-weight);
    letter-spacing: var(--layform-heading-3-tracking);
  }
  [data-sv='heading'][data-level='4'] {
    font-size: var(--layform-heading-4-size);
    font-weight: var(--layform-heading-4-weight);
    letter-spacing: var(--layform-heading-4-tracking);
  }
  [data-sv='heading'][data-kicker='true'] {
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
</style>
