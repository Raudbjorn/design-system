<!--
  Button — bureaucratic action control (Anonymous Pro caps, sharp corners,
  stamped press). Renders <a> when `href` is set, else <button>. `loading`
  sets aria-busy. Variants surface as data-variant for CSS.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type {
    HTMLButtonAttributes,
    HTMLAnchorAttributes
  } from "svelte/elements";

  type Variant = "default" | "primary" | "danger" | "ghost";
  type Size = "sm" | "md" | "lg";

  // Extends button attributes so consumers can pass id/class/aria-*/data-*/…
  // typed passthrough (…rest). href switches the render to an <a>.
  interface Props extends Omit<HTMLButtonAttributes, "type"> {
    /** Visual weight / intent. */
    variant?: Variant;
    /** Control size. */
    size?: Size;
    /** Render an anchor instead of a button. */
    href?: string;
    /** Show a busy state; sets aria-busy and blocks activation. */
    loading?: boolean;
    /** Native button type when rendering a <button>. */
    type?: "button" | "submit" | "reset";
    /** Label content. */
    children?: Snippet;
  }

  let {
    variant = "default",
    size = "md",
    href,
    disabled = false,
    loading = false,
    type = "button",
    onclick,
    children,
    ...rest
  }: Props = $props();

  const inert = $derived(disabled || loading);

  function handle(event: MouseEvent) {
    if (inert) {
      event.preventDefault();
      return;
    }
    onclick?.(event);
  }
</script>

{#if href}
  <a
    class="btn"
    data-variant={variant}
    data-size={size}
    href={inert ? undefined : href}
    aria-disabled={inert ? "true" : undefined}
    aria-busy={loading ? "true" : undefined}
    onclick={handle}
    {...(rest as HTMLAnchorAttributes)}
  >
    <span class="label">{@render children?.()}</span>
  </a>
{:else}
  <button
    class="btn"
    data-variant={variant}
    data-size={size}
    {type}
    disabled={disabled}
    aria-busy={loading ? "true" : undefined}
    onclick={handle}
    {...rest}
  >
    <span class="label">{@render children?.()}</span>
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--carter-space-2);
    font-family: var(--carter-font-mono);
    font-weight: var(--carter-weight-strong);
    text-transform: uppercase;
    letter-spacing: var(--carter-tracking-btn);
    line-height: 1;
    text-decoration: none;
    color: var(--carter-text);
    background: var(--carter-surface-raise);
    border: var(--carter-border-rule) solid var(--carter-border-strong);
    border-radius: var(--carter-radius-md);
    cursor: pointer;
    transition:
      transform var(--carter-dur-fast, 90ms) var(--carter-ease-out, ease),
      background 90ms ease,
      border-color 90ms ease;
  }
  .btn[data-size="sm"] { padding: 0.35em 0.75em; font-size: var(--carter-fs-2xs); }
  .btn[data-size="md"] { padding: 0.55em 1.1em; font-size: var(--carter-fs-xs); }
  .btn[data-size="lg"] { padding: 0.7em 1.5em; font-size: var(--carter-fs-sm); }

  .btn:hover { border-color: var(--carter-text); }
  .btn:active { transform: translate(1px, 1px); }
  .btn:focus-visible { outline: 2px solid var(--carter-focus); outline-offset: 2px; }

  .btn[data-variant="primary"] {
    color: var(--carter-primary-ink);
    background: var(--carter-primary);
    border-color: var(--carter-primary);
  }
  .btn[data-variant="primary"]:hover { filter: brightness(1.12); }

  .btn[data-variant="danger"] {
    color: var(--carter-danger-ink);
    background: var(--carter-danger);
    border-color: var(--carter-danger);
  }
  .btn[data-variant="danger"]:hover { filter: brightness(1.12); }

  .btn[data-variant="ghost"] {
    background: transparent;
    border-color: var(--carter-border);
    color: var(--carter-text-muted);
  }
  .btn[data-variant="ghost"]:hover { color: var(--carter-text); border-color: var(--carter-text-muted); }

  .btn:disabled,
  .btn[aria-disabled="true"] {
    opacity: 0.45;
    cursor: not-allowed;
    filter: none;
    transform: none;
  }
  .btn[aria-busy="true"] { cursor: progress; }

  @media (prefers-reduced-motion: reduce) {
    .btn { transition: none; }
    .btn:active { transform: none; }
  }
</style>
