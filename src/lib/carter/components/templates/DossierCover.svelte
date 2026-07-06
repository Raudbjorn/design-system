<!--
  DossierCover — full document cover page. Classification banners top and
  bottom bracket a dark, vignetted focal panel and a title block; rubber
  stamps cluster in a corner like an intake clerk's ink.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import ClassificationBanner from "../atoms/ClassificationBanner.svelte";
  import Stamp from "../atoms/Stamp.svelte";
  import Heading from "../atoms/Heading.svelte";

  interface Props {
    /** Document title, e.g. the operation name. */
    title: string;
    /** Subtitle / dek, set in framing serif prose. */
    subtitle?: string;
    /** Classification level for the top/bottom banners. */
    classification?: string;
    /** Compartment / caveat. */
    caveat?: string;
    /** Volume marker, e.g. "VOL. II". */
    volume?: string;
    /** Case file number. */
    caseNo?: string;
    /** Stamp labels rendered as a rotated corner cluster. */
    stamps?: string[];
    /** Cover art / focal panel content; falls back to a dark placeholder. */
    focal?: Snippet;
  }

  let {
    title,
    subtitle,
    classification = "TOP SECRET",
    caveat = "SAR-DELTA GREEN",
    volume,
    caseNo,
    stamps = [],
    focal
  }: Props = $props();

  // Deterministic hand-stamped angles for the corner cluster (no randomness).
  const STAMP_ANGLES = [-8, 6, -14, 11, -4, 9];
  function angleFor(index: number): number {
    return STAMP_ANGLES[index % STAMP_ANGLES.length] ?? 0;
  }
</script>

<section class="cover" aria-label={`Dossier cover: ${title}`}>
  <ClassificationBanner level={classification} {caveat} />

  <div class="focal carter-vignette">
    {#if focal}
      {@render focal()}
    {:else}
      <div class="focal-placeholder" aria-hidden="true"></div>
    {/if}

    {#if stamps.length > 0}
      <div class="stamp-cluster">
        {#each stamps as label, index (label + index)}
          <div class="stamp-slot">
            <Stamp {label} angle={angleFor(index)} />
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="title-block">
    <Heading level={1}>{title}</Heading>
    {#if subtitle}
      <p class="subtitle carter-serif">{subtitle}</p>
    {/if}
    {#if volume || caseNo}
      <p class="meta carter-tnum">
        {#if volume}<span>{volume}</span>{/if}
        {#if volume && caseNo}<span class="sep" aria-hidden="true">/</span>{/if}
        {#if caseNo}<span>{caseNo}</span>{/if}
      </p>
    {/if}
  </div>

  <ClassificationBanner level={classification} {caveat} />
</section>

<style>
  .cover {
    display: flex;
    flex-direction: column;
    background: var(--carter-bg-sunk);
    color: var(--carter-text);
  }

  .focal {
    position: relative;
    flex: 1 1 auto;
    min-height: 22rem;
    overflow: hidden;
    background: var(--carter-surface);
  }

  .focal-placeholder {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      120% 100% at 50% 30%,
      var(--carter-surface-raise) 0%,
      var(--carter-bg-sunk) 100%
    );
  }

  .stamp-cluster {
    position: absolute;
    z-index: var(--carter-z-stamp);
    right: var(--carter-space-5);
    bottom: var(--carter-space-5);
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--carter-space-2);
    max-width: 60%;
  }

  .stamp-slot {
    display: inline-flex;
  }

  .title-block {
    padding: var(--carter-space-6) var(--carter-space-5);
    background: var(--carter-bg);
    border-top: var(--carter-border-rule) solid var(--carter-border-strong);
  }

  .subtitle {
    margin: var(--carter-space-3) 0 0;
    font-size: var(--carter-fs-lg);
    color: var(--carter-text-muted);
  }

  .meta {
    display: flex;
    gap: var(--carter-space-2);
    margin: var(--carter-space-4) 0 0;
    font-family: var(--carter-font-mono);
    font-size: var(--carter-fs-xs);
    letter-spacing: var(--carter-tracking-label);
    text-transform: uppercase;
    color: var(--carter-text-faint);
  }

  .sep {
    opacity: 0.5;
  }
</style>
