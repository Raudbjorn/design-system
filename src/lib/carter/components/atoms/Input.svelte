<!--
  Input — government intake line. Wide-tracked mono label over a
  transparent control with a dotted fill-in rule (a full dotted border
  for the textarea variant). Focus solidifies to --carter-focus; invalid
  switches the rule and hint to --carter-danger.
-->
<script lang="ts">
  import type { HTMLInputAttributes, HTMLTextareaAttributes } from "svelte/elements";

  type Type = "text" | "email" | "number" | "password" | "search" | "textarea";

  // Extends input attributes (a superset that also covers <textarea>) so
  // consumers can pass id/class/aria-*/data-*/… typed passthrough (…rest).
  // `type="textarea"` switches the render to a multi-line field.
  interface Props extends Omit<HTMLInputAttributes, "type" | "value"> {
    /** Field label, always visible above the control. */
    label: string;
    /** Bindable field value. */
    value?: string;
    /** Control type; "textarea" renders a multi-line field. */
    type?: Type;
    /** Helper text rendered below the control. */
    hint?: string;
    /** Marks the field as invalid; recolors the rule and hint. */
    invalid?: boolean;
  }

  const uid = $props.id();

  let {
    label,
    value = $bindable(""),
    placeholder,
    type = "text",
    hint,
    invalid = false,
    disabled,
    readonly,
    required,
    id = `carter-input-${uid}`,
    ...rest
  }: Props = $props();

  const hintId = $derived(hint ? `${id}-hint` : undefined);
  const describedBy = $derived(hint ? hintId : undefined);
</script>
<div class="field">
  <label class="carter-label" for={id}>{label}</label>
  {#if type === "textarea"}
    <textarea
      {id}
      {placeholder}
      {disabled}
      {readonly}
      {required}
      aria-invalid={invalid ? "true" : undefined}
      aria-describedby={describedBy}
      bind:value
      {...rest as unknown as HTMLTextareaAttributes}
    ></textarea>
  {:else}
    <input
      {id}
      {type}
      {placeholder}
      {disabled}
      {readonly}
      {required}
      aria-invalid={invalid ? "true" : undefined}
      aria-describedby={describedBy}
      bind:value
      {...rest}
    />
  {/if}
  {#if hint}
    <p id={hintId} class="hint" data-invalid={invalid ? "true" : undefined}>{hint}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--carter-space-1);
  }

  input,
  textarea {
    font-family: var(--carter-font-mono);
    font-size: var(--carter-fs-sm);
    color: var(--carter-text);
    background: transparent;
    border: 0;
    border-bottom: var(--carter-border-hair) dotted var(--carter-border-strong);
    border-radius: 0;
    padding: var(--carter-space-2) var(--carter-space-1);
    outline: none;
  }

  textarea {
    border: var(--carter-border-hair) dotted var(--carter-border-strong);
    border-radius: var(--carter-radius-sm);
    min-height: 6em;
    resize: vertical;
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--carter-text-faint);
  }

  input:focus-visible,
  textarea:focus-visible {
    border-style: solid;
    border-color: var(--carter-focus);
  }

  input[aria-invalid="true"],
  textarea[aria-invalid="true"] {
    border-color: var(--carter-danger);
  }

  .hint {
    margin: 0;
    font-family: var(--carter-font-mono);
    font-size: var(--carter-fs-2xs);
    color: var(--carter-text-faint);
  }

  .hint[data-invalid="true"] {
    color: var(--carter-danger);
  }
</style>
