<!--
  ClearanceBadge — status chip with a leading filled marker square in the
  tone color, bordered and keyed to `tone`, small mono uppercase.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  type Tone = "primary" | "danger" | "warning" | "muted";

  interface Props {
    /** Visual weight / intent. */
    tone?: Tone;
    /** Badge label content. */
    children: Snippet;
  }

  let { tone = "primary", children }: Props = $props();
</script>

<span class="badge" data-tone={tone}>
  <span class="dot" aria-hidden="true"></span>
  <span class="label">{@render children()}</span>
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--carter-space-2);
    padding: 0.2em 0.6em;
    font-family: var(--carter-font-mono);
    font-weight: var(--carter-weight-strong);
    font-size: var(--carter-fs-2xs);
    letter-spacing: var(--carter-tracking-label);
    text-transform: uppercase;
    color: var(--carter-text);
    border: var(--carter-border-hair) solid var(--carter-border);
    border-radius: var(--carter-radius-sm);
  }

  .dot {
    width: 0.5em;
    height: 0.5em;
    flex: 0 0 auto;
    background: var(--carter-primary);
  }

  .badge[data-tone="primary"] { border-color: var(--carter-primary); }
  .badge[data-tone="primary"] .dot { background: var(--carter-primary); }

  .badge[data-tone="danger"] { border-color: var(--carter-danger); }
  .badge[data-tone="danger"] .dot { background: var(--carter-danger); }

  .badge[data-tone="warning"] { border-color: var(--carter-warning); }
  .badge[data-tone="warning"] .dot { background: var(--carter-warning); }

  .badge[data-tone="muted"] { border-color: var(--carter-border); }
  .badge[data-tone="muted"] .dot { background: var(--carter-text-muted); }
</style>
