<!--
  Checkbox — typewriter [X] authorize toggle. A real <input type="checkbox">
  visually replaced with a mono "[X]"/"[ ]" glyph, so it stays natively
  accessible and keyboard-toggles with Space.
-->
<script lang="ts">
  interface Props {
    /** Bindable checked state. */
    checked?: boolean;
    /** Label rendered beside the glyph. */
    label: string;
    /** Disables the control. */
    disabled?: boolean;
    /** Element id; auto-generated and stable across SSR when omitted. */
    id?: string;
  }

  const uid = $props.id();

  let {
    checked = $bindable(false),
    label,
    disabled = false,
    id = `carter-checkbox-${uid}`
  }: Props = $props();
</script>

<label class="checkbox" for={id} data-disabled={disabled ? "true" : undefined}>
  <input
    type="checkbox"
    {id}
    {disabled}
    bind:checked
    aria-checked={checked}
  />
  <span class="glyph" aria-hidden="true">[{checked ? "X" : " "}]</span>
  <span class="text">{label}</span>
</label>

<style>
  .checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--carter-space-2);
    font-family: var(--carter-font-mono);
    font-size: var(--carter-fs-sm);
    color: var(--carter-text);
    cursor: pointer;
  }

  .glyph {
    font-weight: var(--carter-weight-strong);
    color: var(--carter-primary);
  }

  input {
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

  input:focus-visible ~ .glyph {
    outline: 2px solid var(--carter-focus);
    outline-offset: 2px;
  }

  .checkbox[data-disabled="true"] {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
