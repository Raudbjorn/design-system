<!--
  Kicker — wide-tracked eyebrow / classification label above a headline
  or section. Built on the `.carter-label` utility voice.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  type Tone = "muted" | "primary" | "danger";

  interface Props {
    /** Kicker content. */
    children: Snippet;
    /** Color tint. */
    tone?: Tone;
  }

  let { children, tone = "muted" }: Props = $props();
</script>

<p class="carter-label kicker" data-tone={tone}>{@render children()}</p>

<style>
  .kicker {
    margin: 0;
  }

  .kicker[data-tone="primary"] { color: var(--carter-primary); }
  .kicker[data-tone="danger"] { color: var(--carter-danger); }
</style>
