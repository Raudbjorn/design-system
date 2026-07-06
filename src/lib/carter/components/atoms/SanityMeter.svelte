<!--
  SanityMeter — segmented SAN/HP gauge. Renders `max` segments, the
  first `value` filled in the tone color, the rest outlined only.
  Value and max are defensively clamped so the gauge never overflows.
-->
<script lang="ts">
  type Tone = "primary" | "danger" | "warning";

  interface Props {
    /** Current value; clamped into [0, max]. */
    value: number;
    /** Segment count; clamped to at least 1. */
    max?: number;
    /** Gauge label, e.g. "SAN". */
    label?: string;
    /** Visual weight of the filled segments. */
    tone?: Tone;
  }

  let { value, max = 10, label = "SAN", tone = "primary" }: Props = $props();

  const clampedMax = $derived(Math.max(1, Math.floor(max)));
  const clampedValue = $derived(Math.min(clampedMax, Math.max(0, Math.floor(value))));
</script>

<div
  class="meter"
  data-tone={tone}
  role="img"
  aria-label={`${label}: ${clampedValue} of ${clampedMax}`}
>
  <span class="carter-label name">{label}</span>
  <span class="segments" aria-hidden="true">
    {#each { length: clampedMax } as _, i}
      <span class="segment" data-filled={i < clampedValue ? "true" : undefined}></span>
    {/each}
  </span>
  <span class="carter-tnum readout" aria-hidden="true">{clampedValue}/{clampedMax}</span>
</div>

<style>
  .meter {
    display: inline-flex;
    align-items: center;
    gap: var(--carter-space-2);
  }

  .name {
    color: var(--carter-text-muted);
  }

  .segments {
    display: inline-flex;
    gap: 2px;
  }

  .segment {
    width: 0.9em;
    height: 1em;
    border: var(--carter-border-hair) solid var(--carter-border-strong);
    border-radius: var(--carter-radius-sm);
    background: transparent;
  }

  .segment[data-filled="true"] {
    background: var(--carter-primary);
    border-color: var(--carter-primary);
  }

  .meter[data-tone="danger"] .segment[data-filled="true"] {
    background: var(--carter-danger);
    border-color: var(--carter-danger);
  }

  .meter[data-tone="warning"] .segment[data-filled="true"] {
    background: var(--carter-warning);
    border-color: var(--carter-warning);
  }

  .readout {
    font-size: var(--carter-fs-xs);
    color: var(--carter-text-faint);
  }
</style>
