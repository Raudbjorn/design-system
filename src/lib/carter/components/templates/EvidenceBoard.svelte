<!--
  EvidenceBoard — the conspiracy corkboard. Evidence photos are pinned by
  percentage position on a dark, grained surface; an SVG overlay draws red
  string between connected items. Items with no explicit x/y fall back to a
  deterministic scatter (golden-ratio stride, no randomness) keyed by index.
-->
<script lang="ts">
  import EvidencePhoto from "../molecules/EvidencePhoto.svelte";

  interface EvidenceItem {
    alt: string;
    caption?: string;
    src?: string;
    stamp?: string;
    angle?: number;
    x?: number;
    y?: number;
  }

  interface Props {
    /** Photos pinned to the board. */
    items?: EvidenceItem[];
    /** Index pairs (into `items`) connected with red string. */
    connections?: [number, number][];
  }

  let { items = [], connections = [] }: Props = $props();

  function clampPct(value: number): number {
    return Math.min(100, Math.max(0, value));
  }

  // Deterministic pseudo-scatter (golden-ratio stride) so unpositioned items
  // still spread across the board without repeating a grid or using Math.random.
  function scatterX(index: number): number {
    return clampPct(12 + ((index * 61.8034) % 70));
  }
  function scatterY(index: number): number {
    return clampPct(15 + ((index * 38.1966 + 20) % 65));
  }

  const pins = $derived(
    items.map((item, index) => ({
      ...item,
      left: item.x !== undefined ? clampPct(item.x) : scatterX(index),
      top: item.y !== undefined ? clampPct(item.y) : scatterY(index)
    }))
  );

  const strings = $derived(
    connections
      .filter(
        ([a, b]) => a >= 0 && a < items.length && b >= 0 && b < items.length && a !== b
      )
      .map(([a, b]) => ({
        x1: pins[a]!.left,
        y1: pins[a]!.top,
        x2: pins[b]!.left,
        y2: pins[b]!.top
      }))
  );
</script>

<div class="board carter-grain" role="group" aria-label="Evidence board">
  <svg class="strings" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    {#each strings as line, index (index)}
      <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
    {/each}
  </svg>

  {#each pins as pin, index (pin.alt + index)}
    <div class="pin" style={`left: ${pin.left}%; top: ${pin.top}%;`}>
      <EvidencePhoto alt={pin.alt} caption={pin.caption} src={pin.src} stamp={pin.stamp} angle={pin.angle} />
    </div>
  {/each}
</div>

<style>
  .board {
    position: relative;
    min-height: 32rem;
    overflow: hidden;
    background: var(--carter-bg-sunk);
    border: var(--carter-border-hair) solid var(--carter-border);
    border-radius: var(--carter-radius-panel);
  }

  .strings {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: var(--carter-z-frame);
  }

  .strings line {
    stroke: var(--carter-danger);
    stroke-width: 0.35;
    opacity: 0.75;
  }

  .pin {
    position: absolute;
    z-index: var(--carter-z-frame);
    transform: translate(-50%, -50%);
  }
</style>
