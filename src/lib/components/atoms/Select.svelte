<script lang="ts">
  interface Option {
    value: string;
    label: string;
  }

  interface Props {
    value?: string;
    options: Option[];
    id?: string;
    label?: string;
    disabled?: boolean;
    onchange?: (e: Event) => void;
  }

  let {
    value = $bindable(''),
    options,
    id,
    label,
    disabled = false,
    onchange
  }: Props = $props();
</script>

<div data-sv="field">
  {#if label}<label data-sv="field-label" for={id}>{label}</label>{/if}
  <div data-sv="select-wrap">
    <select {id} {disabled} data-sv="select" bind:value {onchange}>
      {#each options as o (o.value)}
        <option value={o.value}>{o.label}</option>
      {/each}
    </select>
    <span data-sv="select-caret" aria-hidden="true">▾</span>
  </div>
</div>

<style>
  [data-sv='field'] {
    display: flex;
    flex-direction: column;
    gap: var(--sv-space-2);
  }
  [data-sv='field-label'] {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-muted);
  }
  [data-sv='select-wrap'] { position: relative; }
  [data-sv='select'] {
    width: 100%;
    box-sizing: border-box;
    appearance: none;
    background: var(--sv-surface-1);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-md);
    color: var(--sv-text);
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    padding: var(--sv-space-2) var(--sv-space-8) var(--sv-space-2) var(--sv-space-3);
    outline: none;
    cursor: pointer;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }
  [data-sv='select']:focus-visible {
    border-color: var(--sv-accent);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--sv-accent), transparent 78%);
  }
  [data-sv='select']:disabled { opacity: 0.5; cursor: not-allowed; }
  [data-sv='select-caret'] {
    position: absolute;
    right: var(--sv-space-3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--sv-text-muted);
    pointer-events: none;
    font-size: 0.7em;
  }
</style>
