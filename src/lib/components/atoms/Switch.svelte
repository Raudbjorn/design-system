<script lang="ts">
  import type { Snippet } from 'svelte';

  type SharedProps = {
    checked?: boolean;
    disabled?: boolean;
    id?: string;
    onchange?: (checked: boolean) => void;
  };

  type Props = SharedProps &
    (
      | { children: Snippet; 'aria-label'?: never }
      | { children?: never; 'aria-label': string }
    );

  const uid = $props.id();

  let {
    checked = $bindable(false),
    disabled = false,
    id,
    'aria-label': ariaLabel,
    onchange,
    children
  }: Props = $props();

  const labelId = $derived(children ? (id ? `${id}-label` : `sv-switch-label-${uid}`) : undefined);

  function toggle() {
    if (disabled) return;
    checked = !checked;
    onchange?.(checked);
  }
</script>

<label data-sv="switch-row" data-disabled={disabled || undefined}>
  {#if children}<span data-sv="switch-label" id={labelId}>{@render children()}</span>{/if}
  <button
    {id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-labelledby={labelId}
    aria-label={labelId ? undefined : ariaLabel}
    data-sv="switch"
    data-on={checked}
    {disabled}
    onclick={toggle}
  >
    <span data-sv="switch-knob"></span>
  </button>
</label>

<style>
  [data-sv='switch-row'] {
    display: inline-flex;
    align-items: center;
    gap: var(--sv-space-3);
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text);
  }
  [data-sv='switch'] {
    position: relative;
    flex: none;
    width: 44px;
    height: 24px;
    border: none;
    border-radius: 999px;
    padding: 0;
    cursor: pointer;
    background: var(--sv-surface-3);
    transition: background 0.15s ease;
  }
  [data-on='true'] { background: var(--sv-accent); }
  [data-sv='switch-knob'] {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--sv-text-strong);
    transition: transform 0.15s ease;
  }
  [data-on='true'] [data-sv='switch-knob'] { transform: translateX(20px); }
  [data-sv='switch']:focus-visible {
    outline: 2px solid var(--sv-accent);
    outline-offset: 2px;
  }
  [data-disabled] { opacity: 0.5; }
  [data-disabled] [data-sv='switch'] { cursor: not-allowed; }
</style>
