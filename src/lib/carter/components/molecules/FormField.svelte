<!--
  FormField — labeled field wrapper (the reference-zone frame around any
  control: label, control slot, hint/error). Distinct from the Input atom it
  wraps. A Snippet can't have props injected into it from here, so the
  consumer's control must share `id` with this field (for label association)
  and reference `${id}-hint` / `${id}-error` via its own aria-describedby.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** Field label text. */
    label: string;
    /** Helper text shown when there is no error. */
    hint?: string;
    /** Error message; replaces the hint and is announced via role="alert". */
    error?: string;
    /** Marks the field required; shows a "*" plus visually-hidden "required". */
    required?: boolean;
    /**
     * Id shared with the consumer's control for label association. REQUIRED:
     * an auto-generated id would be invisible to the child control and would
     * silently break the `<label for>` link, so the caller must supply it.
     */
    id: string;
    /** The control itself, e.g. an Input or native input/textarea. */
    children?: Snippet;
  }

  let { label, hint, error, required = false, id, children }: Props = $props();

  /** Wire the control's aria-describedby to whichever of these renders. */
  const hintId = $derived(`${id}-hint`);
  const errorId = $derived(`${id}-error`);
</script>

<div class="field">
  <label class="field-label carter-label" for={id}>
    {label}
    {#if required}
      <span class="required-mark" aria-hidden="true">*</span>
      <span class="visually-hidden"> required</span>
    {/if}
  </label>

  <div class="control">
    {@render children?.()}
  </div>

  {#if error}
    <p class="message error" id={errorId} role="alert">{error}</p>
  {:else if hint}
    <p class="message hint" id={hintId}>{hint}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--carter-space-2);
  }

  .field-label {
    display: inline-flex;
    align-items: baseline;
    gap: var(--carter-space-1);
  }

  .required-mark {
    color: var(--carter-danger);
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .control {
    border-radius: var(--carter-radius-none);
  }

  .message {
    margin: 0;
    font-family: var(--carter-font-mono);
    font-size: var(--carter-fs-2xs);
  }

  .hint {
    color: var(--carter-text-faint);
  }

  .error {
    color: var(--carter-danger);
  }
</style>
