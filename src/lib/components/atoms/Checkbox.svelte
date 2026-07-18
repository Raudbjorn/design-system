<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked' | 'onchange' | 'children'> {
    /** Two-way checked state. */
    checked?: boolean;
    /** Renders the coral "unavailable" state (non-interactive). */
    disabled?: boolean;
    onchange?: (checked: boolean) => void;
    children?: Snippet;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    id,
    onchange,
    children,
    ...rest
  }: Props = $props();
</script>

<label data-sv="checkbox" data-checked={checked} data-disabled={disabled || undefined}>
  <input
    {...rest}
    {id}
    type="checkbox"
    bind:checked
    {disabled}
    onchange={(event) => onchange?.(event.currentTarget.checked)}
  />
  <span data-sv="checkbox-box"><span data-sv="checkbox-mark">✓</span></span>
  {#if children}<span data-sv="checkbox-label">{@render children()}</span>{/if}
</label>

<style>
  [data-sv='checkbox'] {
    display: inline-flex;
    align-items: center;
    gap: var(--sv-space-3);
    cursor: pointer;
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text);
  }
  [data-sv='checkbox'] input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
  [data-sv='checkbox-box'] {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    box-sizing: border-box;
    border-radius: var(--sv-radius-sm);
    border: 2px solid var(--sv-border);
    background: transparent;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.3);
  }
  [data-sv='checkbox-mark'] {
    color: var(--sv-bg);
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    transform: scale(0);
    transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.3);
  }
  [data-checked='true'] [data-sv='checkbox-box'] {
    border-color: var(--sv-accent);
    background: var(--sv-accent);
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--sv-accent), transparent 80%);
  }
  [data-checked='true'] [data-sv='checkbox-mark'] { transform: scale(1); }

  /* Coral "unavailable" state (locked design decision: coral = unavailable). */
  [data-disabled] { cursor: not-allowed; color: color-mix(in oklab, var(--sv-accent-2), var(--sv-text-faint) 40%); }
  [data-disabled] input { pointer-events: none; }
  [data-disabled] [data-sv='checkbox-box'] {
    border-color: var(--sv-accent-2);
    background: transparent;
    box-shadow: none;
  }
  [data-disabled][data-checked='true'] [data-sv='checkbox-box'] {
    background: var(--sv-accent-2);
  }
  [data-disabled][data-checked='true'] [data-sv='checkbox-mark'] { transform: scale(1); }

  [data-sv='checkbox'] input:focus-visible + [data-sv='checkbox-box'] {
    outline: 2px solid var(--sv-accent);
    outline-offset: 2px;
  }
</style>
