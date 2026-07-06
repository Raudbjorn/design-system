<!--
  Redaction — blacked-out inline text; the truth is under there. When
  `reveal` is allowed (and not `locked`), hover/focus or Enter/Space
  toggles the bar open. `locked` never reveals.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** Whether this redaction may ever be revealed. */
    reveal?: boolean;
    /** Locked redactions never reveal, regardless of `reveal`. */
    locked?: boolean;
    /** The redacted content. */
    children: Snippet;
  }

  let { reveal = true, locked = false, children }: Props = $props();

  const revealable = $derived(reveal && !locked);
  let open = $state(false);

  function show() {
    if (revealable) open = true;
  }
  function hide() {
    open = false;
  }
  function toggle() {
    if (revealable) open = !open;
  }
  function onKeydown(event: KeyboardEvent) {
    if (!revealable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  }
</script>

{#if revealable}
  <span
    class="redaction"
    class:open
    role="button"
    tabindex="0"
    aria-label={open ? undefined : "Redacted"}
    onmouseenter={show}
    onmouseleave={hide}
    onfocus={show}
    onblur={hide}
    onclick={toggle}
    onkeydown={onKeydown}
  >
    {@render children()}
  </span>
{:else}
  <span class="redaction carter-redaction" class:locked aria-label="Redacted">
    {@render children()}
  </span>
{/if}

<style>
  .redaction {
    display: inline;
    box-decoration-break: clone;
    -webkit-box-decoration-break: clone;
    border-radius: var(--carter-radius-sm);
    padding: 0 0.15em;
    cursor: pointer;
    color: var(--carter-classified);
    background: var(--carter-classified);
    transition: color 90ms ease, background-color 90ms ease;
  }

  .redaction.open {
    color: var(--carter-text);
    background: color-mix(in srgb, var(--carter-warning) 20%, transparent);
  }

  .redaction:focus-visible {
    outline: 2px solid var(--carter-focus);
    outline-offset: 2px;
  }

  .redaction.locked {
    cursor: not-allowed;
  }

  @media (prefers-reduced-motion: reduce) {
    .redaction { transition: none; }
  }
</style>
