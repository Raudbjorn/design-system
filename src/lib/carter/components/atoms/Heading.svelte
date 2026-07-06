<!--
  Heading — Oswald heading ladder. Renders h1–h4 per the token ladder,
  uppercase display voice. An optional `kicker` renders a wide-tracked
  eyebrow label above the heading (a real heading element either way).
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  type Level = 1 | 2 | 3 | 4;

  interface Props {
    /** Heading level; drives both the tag and the size/weight/tracking. */
    level?: Level;
    /** Optional eyebrow label rendered above the heading. */
    kicker?: string;
    /** Heading content. */
    children: Snippet;
  }

  let { level = 2, kicker, children }: Props = $props();
</script>

{#if kicker}
  <p class="carter-label kicker">{kicker}</p>
{/if}

<svelte:element this={`h${level}`} class="heading" data-level={level}>
  {@render children()}
</svelte:element>

<style>
  .kicker {
    margin: 0 0 var(--carter-space-1);
  }

  .heading {
    margin: 0;
    font-family: var(--carter-font-display);
    text-transform: uppercase;
    color: var(--carter-text);
  }

  .heading[data-level="1"] {
    font-size: var(--carter-h1-size);
    font-weight: var(--carter-h1-weight);
    letter-spacing: var(--carter-h1-tracking);
  }
  .heading[data-level="2"] {
    font-size: var(--carter-h2-size);
    font-weight: var(--carter-h2-weight);
    letter-spacing: var(--carter-h2-tracking);
  }
  .heading[data-level="3"] {
    font-size: var(--carter-h3-size);
    font-weight: var(--carter-h3-weight);
    letter-spacing: var(--carter-h3-tracking);
  }
  .heading[data-level="4"] {
    font-size: var(--carter-h4-size);
    font-weight: var(--carter-h4-weight);
    letter-spacing: var(--carter-h4-tracking);
  }
</style>
