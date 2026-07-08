<script lang="ts">
  interface Props {
    value?: string;
    id?: string;
    label?: string;
    hint?: string;
    error?: string | boolean;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'search';
    mono?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    oninput?: (e: Event) => void;
  }

  let {
    value = $bindable(''),
    id,
    label,
    hint,
    error = false,
    placeholder,
    type = 'text',
    mono = false,
    disabled = false,
    readonly = false,
    oninput
  }: Props = $props();

  const hasError = $derived(!!error);
  const message = $derived(typeof error === 'string' ? error : '');
  const descId = $derived(id && (message || hint) ? `${id}-desc` : undefined);
</script>

<div data-sv="field">
  {#if label}<label data-sv="field-label" for={id}>{label}</label>{/if}
  <input
    {id}
    {type}
    {placeholder}
    {disabled}
    {readonly}
    data-sv="input"
    data-mono={mono}
    data-error={hasError || undefined}
    aria-invalid={hasError || undefined}
    aria-describedby={descId}
    bind:value
    {oninput}
  />
  {#if message}
    <span data-sv="field-msg" id={descId}>{message}</span>
  {:else if hint}
    <span data-sv="field-hint" id={descId}>{hint}</span>
  {/if}
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
  [data-sv='input'] {
    width: 100%;
    box-sizing: border-box;
    background: var(--sv-surface-1);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-md);
    color: var(--sv-text);
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    padding: var(--sv-space-2) var(--sv-space-3);
    outline: none;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }
  [data-mono='true'] { font-family: var(--sv-font-mono); }
  [data-sv='input']::placeholder { color: var(--sv-text-faint); }
  [data-sv='input']:focus-visible {
    border-color: var(--sv-accent);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--sv-accent), transparent 78%);
  }
  [data-sv='input'][data-error] {
    border-color: var(--sv-error);
  }
  [data-sv='input'][data-error]:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--sv-error), transparent 78%);
  }
  [data-sv='input']:disabled { opacity: 0.5; cursor: not-allowed; }
  [data-sv='field-hint'] {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
  }
  [data-sv='field-msg'] {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-xs);
    color: var(--sv-error);
  }
</style>
