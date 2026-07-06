<!--
  Input — government intake line. Wide-tracked mono label over a
  transparent control with a dotted fill-in rule (a full dotted border
  for the textarea variant). Focus solidifies to --carter-focus; invalid
  switches the rule and hint to --carter-danger.
-->
<script lang="ts">
  type Type = "text" | "email" | "number" | "password" | "search" | "textarea";

  interface Props {
    /** Field label, always visible above the control. */
    label: string;
    /** Bindable field value. */
    value?: string;
    /** Placeholder text. */
    placeholder?: string;
    /** Control type; "textarea" renders a multi-line field. */
    type?: Type;
    /** Helper text rendered below the control. */
    hint?: string;
    /** Marks the field as invalid; recolors the rule and hint. */
    invalid?: boolean;
    /** Disable the control. */
    disabled?: boolean;
    /** Make the control read-only. */
    readonly?: boolean;
    /** Mark the control required. */
    required?: boolean;
    /** Element id; auto-generated and stable across SSR when omitted. */
    id?: string;
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
      bind:value
      {...rest}
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
      bind:value
      {...rest}
    />
  {/if}
  {#if hint}
    <p class="hint" data-invalid={invalid ? "true" : undefined}>{hint}</p>
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
