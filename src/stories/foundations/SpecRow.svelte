<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Mono token label rendered in the left column. */
    label: string;
    /** CSS length for the label column. */
    labelWidth?: string;
    align?: 'baseline' | 'center';
    children: Snippet;
  }

  let { label, labelWidth = '12rem', align = 'baseline', children }: Props = $props();
</script>

<div
  class="row"
  style:grid-template-columns={`${labelWidth} 1fr`}
  style:align-items={align}
>
  <span class="label">{label}</span>
  {@render children()}
</div>

<style>
  .row {
    display: grid;
    gap: var(--sv-space-4);
  }
  .label {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
  }
</style>
