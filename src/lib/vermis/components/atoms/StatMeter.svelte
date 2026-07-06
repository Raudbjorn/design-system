<!--
  Implements layform Pattern 52 (Stat Meter — Segmented Gauge Bar). See
  patterns/02-component-patterns.md.
-->
<script lang="ts">
  interface Props {
    value: number;
    max: number;
    label?: string;
  }

  let { value, max, label = '' }: Props = $props();

  // Defensive clamp (Pattern 52's own text notes this widget renders *inside*
  // Pattern 37's reference zone, i.e. often fed by author-supplied Markdown/data
  // tables): a bad data value degrades visually rather than throwing.
  // Non-finite inputs (Infinity, NaN, undefined-coerced) collapse to 0; a
  // runaway positive cap of 100 also bounds `Array.from({ length })` which
  // would otherwise throw `RangeError: Invalid array length`.
  let segments = $derived(
    Number.isFinite(max) ? Math.min(Math.max(0, Math.trunc(max)), 100) : 0
  );
  let clamped = $derived(
    Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 0), segments) : 0
  );
</script>

<span data-sv="stat-meter" role="img" aria-label={`${label}: ${clamped} of ${segments}`}>
  {#each Array.from({ length: segments }) as _, index (index)}
    <span data-sv="stat-meter-segment" data-filled={index < clamped}></span>
  {/each}
</span>

<style>
  [data-sv='stat-meter'] {
    display: inline-flex;
    align-items: center;
    gap: 0.15em;
    vertical-align: middle;
  }

  /* Pattern 52: N discrete segments (fill vs. outline), not a literal
     illustrative gauge — the simplified, flat-styled reading Pattern 13's
     reference-density containers require. */
  [data-sv='stat-meter-segment'] {
    display: inline-block;
    width: var(--layform-space-2);
    height: var(--layform-space-1);
    border: var(--layform-border-hairline) solid var(--layform-ink);
    background: transparent;
  }
  [data-sv='stat-meter-segment'][data-filled='true'] {
    background: var(--layform-accent);
    border-color: var(--layform-accent);
  }
</style>
