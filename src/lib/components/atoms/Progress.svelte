<script lang="ts">
  interface SharedProps {
    value?: number;
    indeterminate?: boolean;
    tone?: 'accent' | 'accent-2';
  }

  type Props =
    | (SharedProps & { label: string; 'aria-label'?: never })
    | (SharedProps & { label?: never; 'aria-label': string });

  let {
    value = 0,
    indeterminate = false,
    tone = 'accent',
    label,
    'aria-label': ariaLabel
  }: Props = $props();

  const normalized = $derived(Number.isFinite(value) ? value : 0);
  const clamped = $derived(Math.max(0, Math.min(100, normalized)));
</script>

<div data-sv="progress" data-tone={tone}>
  {#if label}
    <div data-sv="progress-head">
      <span data-sv="progress-label">{label}</span>
      {#if !indeterminate}<span data-sv="progress-value">{clamped}%</span>{/if}
    </div>
  {/if}
  <div
    data-sv="progress-track"
    role="progressbar"
    aria-label={label ?? ariaLabel}
    aria-valuenow={indeterminate ? undefined : clamped}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    {#if indeterminate}
      <div data-sv="progress-sweep"></div>
    {:else}
      <div data-sv="progress-fill" style:width={`${clamped}%`}></div>
    {/if}
  </div>
</div>

<style>
  [data-sv='progress'] { --tone: var(--sv-accent); display: flex; flex-direction: column; gap: var(--sv-space-2); }
  [data-tone='accent-2'] { --tone: var(--sv-accent-2); }
  [data-sv='progress-head'] {
    display: flex;
    justify-content: space-between;
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text);
  }
  [data-sv='progress-value'] { font-family: var(--sv-font-mono); color: var(--sv-text-muted); }
  [data-sv='progress-track'] {
    position: relative;
    height: 8px;
    border-radius: 999px;
    background: var(--sv-surface-3);
    overflow: hidden;
  }
  [data-sv='progress-fill'] {
    height: 100%;
    border-radius: 999px;
    background: var(--tone);
    transition: width 0.2s ease;
  }
  [data-sv='progress-sweep'] {
    position: absolute;
    top: 0;
    width: 40%;
    height: 100%;
    border-radius: 999px;
    background: var(--tone);
    animation: sv-progress-indeterminate 1.2s ease-in-out infinite;
  }
  @keyframes sv-progress-indeterminate {
    0% { left: -40%; }
    100% { left: 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-sv='progress-fill'] { transition: none; }
    [data-sv='progress-sweep'] { left: 30%; animation: none; }
  }
</style>
