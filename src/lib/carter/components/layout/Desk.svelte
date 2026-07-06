<!--
  Desk — the dossier work-surface. A sunk, grained backdrop laid out as a
  CSS grid, for arranging case cards, photos, and exhibits.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;

  const GAPS: Gap[] = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12];

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Number of grid columns, clamped to 1..6. */
    columns?: number;
    /** Gap size, mapped to --carter-space-{gap}. */
    gap?: Gap;
    /** Apply interior padding to the surface. */
    padded?: boolean;
    /** Cards, photos, exhibits. */
    children?: Snippet;
  }

  let { columns = 1, gap = 5, padded = true, children, ...rest }: Props = $props();

  const safeColumns = $derived(Math.min(6, Math.max(1, Math.round(columns) || 1)));
  const safeGap = $derived(GAPS.includes(gap) ? gap : 5);
</script>

<div
  class="desk carter-grain"
  class:desk--padded={padded}
  style={`grid-template-columns: repeat(${safeColumns}, 1fr); gap: var(--carter-space-${safeGap})`}
  {...rest}
>
  {@render children?.()}
</div>

<style>
  .desk {
    display: grid;
    background: var(--carter-bg-sunk);
    color: var(--carter-border);
    border: var(--carter-border-hair) solid var(--carter-border);
    border-radius: var(--carter-radius-panel);
  }
  .desk--padded {
    padding: var(--carter-space-5);
  }
</style>
