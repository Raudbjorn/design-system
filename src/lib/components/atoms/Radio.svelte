<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** The selected value of the group (two-way). */
    group?: string;
    /** This option's value. */
    value: string;
    /** Shared radio group name. */
    name: string;
    /** Renders the coral "unavailable" state (non-interactive). */
    disabled?: boolean;
    id?: string;
    onchange?: (value: string) => void;
    children?: Snippet;
  }

  let {
    group = $bindable(),
    value,
    name,
    disabled = false,
    id,
    onchange,
    children
  }: Props = $props();

  const checked = $derived(group === value);
</script>

<label data-sv="radio" data-checked={checked} data-disabled={disabled || undefined}>
  <input
    {id}
    {name}
    {value}
    type="radio"
    bind:group
    {disabled}
    onchange={() => onchange?.(value)}
  />
  <span data-sv="radio-ring"><span data-sv="radio-dot"></span></span>
  {#if children}<span data-sv="radio-label">{@render children()}</span>{/if}
</label>

<style>
  [data-sv='radio'] {
    display: inline-flex;
    align-items: center;
    gap: var(--sv-space-3);
    cursor: pointer;
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text);
  }
  [data-sv='radio'] input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
  [data-sv='radio-ring'] {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    box-sizing: border-box;
    border-radius: 50%;
    border: 2px solid var(--sv-border);
    background: transparent;
    transition: all 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.3);
  }
  [data-sv='radio-dot'] {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--sv-accent);
    transform: scale(0);
    transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.3);
  }
  [data-checked='true'] [data-sv='radio-ring'] {
    border-color: var(--sv-accent);
    box-shadow: 0 0 0 4px color-mix(in oklab, var(--sv-accent), transparent 80%);
  }
  [data-checked='true'] [data-sv='radio-dot'] { transform: scale(1); }

  /* Coral "unavailable" state. */
  [data-disabled] { cursor: not-allowed; color: color-mix(in oklab, var(--sv-accent-2), var(--sv-text-faint) 40%); }
  [data-disabled] input { pointer-events: none; }
  [data-disabled] [data-sv='radio-ring'] { border-color: var(--sv-accent-2); box-shadow: none; }
  [data-disabled] [data-sv='radio-dot'] { transform: scale(0); }

  [data-sv='radio'] input:focus-visible + [data-sv='radio-ring'] {
    outline: 2px solid var(--sv-accent);
    outline-offset: 2px;
  }
</style>
