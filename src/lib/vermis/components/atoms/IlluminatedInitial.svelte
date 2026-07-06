<!--
  Implements layform Pattern 79 (Illuminated Initial for Section-Opening
  Paragraphs). See patterns/03-element-patterns.md.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    firstLetter: string;
    children: Snippet;
  }

  let { firstLetter, children }: Props = $props();

  // Defensive clamp to a single Unicode code point (handles surrogate-pair
  // glyphs like emoji correctly) rather than throwing on multi-char input.
  const glyph = $derived(Array.from(firstLetter)[0] ?? '');
</script>

<p data-sv="illuminated-initial">
  <span class="initial-wrap">
    <svg class="initial-glyph" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <text x="0" y="38">{glyph}</text>
    </svg>
    <span class="visually-hidden">{glyph}</span>
  </span>{@render children()}
</p>

<style>
  [data-sv='illuminated-initial'] {
    line-height: var(--layform-line-height-reading, 1.55);
    font-family: var(--layform-font-reading);
    color: var(--layform-ink);
  }
  .initial-wrap {
    position: relative;
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: baseline;
  }
  .initial-glyph {
    position: absolute;
    inset: 0;
    width: 3em;
    height: 3em;
    overflow: visible;
    pointer-events: none;
  }
  .initial-glyph text {
    font-family: var(--layform-font-display);
    font-size: 2rem;
    fill: var(--layform-accent);
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
</style>
