<!--
  SectionThreshold — full-bleed section-divider spread. A centered display
  title sits between an optional eyebrow and subtitle, with a large faint
  number watermarked behind it. `tone="mortal"` tints the accent danger-red.
-->
<script lang="ts">
  import Kicker from "../atoms/Kicker.svelte";
  import Heading from "../atoms/Heading.svelte";

  type Tone = "default" | "mortal";

  interface Props {
    /** Wide-tracked label above the title. */
    eyebrow?: string;
    /** Section title, set in the display voice. */
    title: string;
    /** Subtitle set in framing serif prose. */
    subtitle?: string;
    /** Large faint number/marker watermarked behind the title. */
    number?: string;
    /** Visual weight; "mortal" tints the accent danger-red. */
    tone?: Tone;
  }

  let { eyebrow, title, subtitle, number, tone = "default" }: Props = $props();
</script>

<section class="threshold carter-vignette" data-tone={tone} aria-label={title}>
  {#if number}
    <span class="number carter-tnum" aria-hidden="true">{number}</span>
  {/if}

  <div class="content">
    {#if eyebrow}
      <Kicker tone={tone === "mortal" ? "danger" : "muted"}>{eyebrow}</Kicker>
    {/if}
    <Heading level={2}>{title}</Heading>
    <span class="rule" aria-hidden="true"></span>
    {#if subtitle}
      <p class="subtitle carter-serif">{subtitle}</p>
    {/if}
  </div>
</section>

<style>
  .threshold {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 24rem;
    padding: var(--carter-space-12) var(--carter-space-5);
    overflow: hidden;
    background: var(--carter-bg-sunk);
    text-align: center;
  }

  .number {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--carter-font-display);
    font-weight: var(--carter-weight-display);
    font-size: var(--carter-fs-3xl);
    line-height: 1;
    color: var(--carter-border);
    opacity: 0.35;
    user-select: none;
    pointer-events: none;
  }

  .content {
    position: relative;
    z-index: var(--carter-z-frame);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--carter-space-4);
    max-width: 42rem;
  }

  .rule {
    width: 4rem;
    height: var(--carter-border-rule);
    background: var(--carter-border-strong);
  }

  .subtitle {
    margin: 0;
    font-size: var(--carter-fs-lg);
    color: var(--carter-text-muted);
  }

  .threshold[data-tone="mortal"] .number {
    color: var(--carter-danger);
    opacity: 0.45;
  }

  .threshold[data-tone="mortal"] .rule {
    background: var(--carter-danger);
  }
</style>
