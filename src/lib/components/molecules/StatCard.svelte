<script lang="ts">
  interface Props {
    value: string;
    label: string;
    tone?: 'accent' | 'accent-2' | 'default';
  }

  let { value, label, tone = 'accent' }: Props = $props();
</script>

<div data-sv="statcard" data-tone={tone}>
  <span class="value">{value}</span>
  <span class="label">{label}</span>
</div>

<style>
  [data-sv='statcard'] {
    display: flex;
    flex-direction: column;
    gap: var(--sv-space-1);
    padding: var(--sv-space-4);
    background: var(--sv-surface-1);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-lg);
  }
  .value {
    font-family: var(--sv-font-mono);
    font-size: var(--sv-fs-3xl);
    line-height: var(--sv-lh-tight);
    font-variant-numeric: tabular-nums;
    color: var(--sv-text-strong);
  }
  [data-tone='accent'] .value { color: var(--sv-accent); }
  [data-tone='accent-2'] .value { color: var(--sv-accent-2); }
  .label {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text-muted);
  }
</style>
