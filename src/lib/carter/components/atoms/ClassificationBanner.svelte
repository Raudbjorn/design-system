<!--
  ClassificationBanner — the TOP SECRET//SAR bar. Full-width hard bar with
  wide-tracked mono caps, hairline rules flanking the text, and a `//`
  separator between level and caveat. `tone` drives the bar's bg/ink pair.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  type Tone = "classified" | "danger" | "warning" | "primary";

  interface Props {
    /** Primary classification level, e.g. "TOP SECRET". */
    level?: string;
    /** Compartment / caveat, e.g. "SAR-DELTA GREEN". */
    caveat?: string;
    /** Visual weight; drives background + ink pairing. */
    tone?: Tone;
    /** Extra right-aligned text (routing marks, case numbers). */
    children?: Snippet;
  }

  let {
    level = "TOP SECRET",
    caveat = "SAR-DELTA GREEN",
    tone = "classified",
    children
  }: Props = $props();

  const label = $derived(caveat ? `${level} // ${caveat}` : level);
</script>

<div class="banner" data-tone={tone} role="note" aria-label={label}>
  <span class="rule" aria-hidden="true"></span>
  <span class="text">{label}</span>
  <span class="rule" aria-hidden="true"></span>
  {#if children}
    <span class="extra">{@render children()}</span>
  {/if}
</div>

<style>
  .banner {
    display: flex;
    align-items: center;
    gap: var(--carter-space-3);
    width: 100%;
    padding: var(--carter-space-2) var(--carter-space-4);
    font-family: var(--carter-font-mono);
    font-weight: var(--carter-weight-strong);
    font-size: var(--carter-fs-xs);
    letter-spacing: var(--carter-tracking-label);
    text-transform: uppercase;
    color: var(--carter-classified-ink);
    background: var(--carter-classified);
  }

  .rule {
    flex: 0 0 var(--carter-space-6);
    height: var(--carter-border-hair);
    background: currentColor;
    opacity: 0.6;
  }

  .text {
    flex: 1 1 auto;
    text-align: center;
  }

  .extra {
    flex: 0 0 auto;
    margin-left: auto;
    font-size: var(--carter-fs-2xs);
    opacity: 0.85;
  }

  .banner[data-tone="danger"] {
    color: var(--carter-danger-ink);
    background: var(--carter-danger);
  }
  .banner[data-tone="warning"] {
    color: var(--carter-warning-ink);
    background: var(--carter-warning);
  }
  .banner[data-tone="primary"] {
    color: var(--carter-primary-ink);
    background: var(--carter-primary);
  }
</style>
