<!--
  Stamp — rubber ink stamp. Oswald display caps, rotated, rendered in the
  tone color with the distressed double-ruled `.carter-stamp-frame`.
-->
<script lang="ts">
  type Tone = "stamp" | "primary" | "ink";

  interface Props {
    /** Stamp text, e.g. "CLASSIFIED". */
    label?: string;
    /** Ink color. */
    tone?: Tone;
    /** Rotation in degrees; clamped to a plausible hand-stamped range. */
    angle?: number;
    /** Double-ruled frame effect. */
    double?: boolean;
  }

  let { label = "CLASSIFIED", tone = "stamp", angle = -8, double = true }: Props = $props();

  const clampedAngle = $derived(Math.max(-45, Math.min(45, angle)));
</script>

<span
  class="stamp"
  class:carter-stamp-frame={double}
  data-tone={tone}
  role="img"
  aria-label={`Stamp: ${label}`}
  style={`--stamp-angle: ${clampedAngle}deg;`}
>
  {label}
</span>

<style>
  .stamp {
    display: inline-block;
    padding: var(--carter-space-2) var(--carter-space-4);
    font-family: var(--carter-font-display);
    font-weight: var(--carter-weight-display);
    font-size: var(--carter-fs-lg);
    letter-spacing: var(--carter-tracking-display);
    text-transform: uppercase;
    line-height: var(--carter-lh-tight);
    transform: rotate(var(--stamp-angle));
    color: var(--carter-stamp);
    user-select: none;
  }

  .stamp[data-tone="primary"] { color: var(--carter-primary); }
  .stamp[data-tone="ink"] { color: var(--carter-text); }
</style>
