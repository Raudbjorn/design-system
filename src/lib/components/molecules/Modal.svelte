<script module lang="ts">
  let _modalUid = 0;
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { trapFocus } from '../../internal/focus-trap';

  interface Props {
    open?: boolean;
    title?: string;
    'aria-label'?: string;
    footer?: Snippet;
    children: Snippet;
    closeOnScrim?: boolean;
    onclose?: () => void;
  }

  let {
    open = $bindable(false),
    title,
    'aria-label': ariaLabel,
    footer,
    children,
    closeOnScrim = true,
    onclose
  }: Props = $props();

  const titleId = `sv-modal-title-${++_modalUid}`;

  function close() {
    open = false;
    onclose?.();
  }
  function onScrim() {
    if (closeOnScrim) close();
  }
  function onKeydown(e: KeyboardEvent) {
    if (open && e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    data-sv="modal-scrim"
    transition:fade={{ duration: 200 }}
    onclick={onScrim}
    role="presentation"
  >
    <div
      data-sv="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : ariaLabel}
      tabindex="-1"
      use:trapFocus
      transition:fly={{ y: 8, duration: 220 }}
      onclick={(e) => e.stopPropagation()}
    >
      {#if title}
        <div data-sv="modal-header">
          <span data-sv="modal-title" id={titleId}>{title}</span>
        </div>
      {/if}
      <div data-sv="modal-body">{@render children()}</div>
      {#if footer}
        <div data-sv="modal-footer">{@render footer()}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  [data-sv='modal-scrim'] {
    position: fixed;
    inset: 0;
    z-index: var(--sv-z-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sv-space-4);
    background: rgba(0, 0, 0, 0.55);
  }
  [data-sv='modal'] {
    width: 420px;
    max-width: 100%;
    background: var(--sv-surface-1);
    border: 1px solid var(--sv-border);
    border-radius: var(--sv-radius-lg);
    box-shadow: var(--sv-shadow-md);
    overflow: hidden;
    outline: none;
  }
  [data-sv='modal-header'] {
    padding: var(--sv-space-4) var(--sv-space-6);
    border-bottom: 1px solid var(--sv-border);
    background: var(--sv-surface-2);
  }
  [data-sv='modal-title'] {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-lg);
    font-weight: var(--sv-font-weight-semibold);
    color: var(--sv-text-strong);
  }
  [data-sv='modal-body'] {
    padding: var(--sv-space-6);
    color: var(--sv-text);
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
  }
  [data-sv='modal-footer'] {
    padding: var(--sv-space-3) var(--sv-space-6);
    border-top: 1px solid var(--sv-border);
    display: flex;
    justify-content: flex-end;
    gap: var(--sv-space-3);
  }
</style>
