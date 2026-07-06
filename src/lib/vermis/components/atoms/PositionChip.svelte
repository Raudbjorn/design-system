<!--
  Implements layform Pattern 59 (Position Indicator Chip).
  See patterns/02-component-patterns.md.
-->
<script lang="ts">
  interface Props {
    current: number;
    total: number;
  }

  let { current, total }: Props = $props();
</script>

<span data-sv="position-chip">{current}/{total}</span>

<style>
  /* No border or fill by default — surrounding chrome is left to the
     consumer (wayfinding strip, paginated list footer, form header). */
  [data-sv='position-chip'] {
    font-family: var(--layform-font-marginalia);
    font-weight: var(--layform-weight-marginalia);
    font-variant-numeric: tabular-nums;
  }
</style>
