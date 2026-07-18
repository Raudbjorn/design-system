<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { trapFocus } from '../../internal/focus-trap';

  interface SharedProps {
    open?: boolean;
    placement?: 'right' | 'left';
    footer?: Snippet;
    children: Snippet;
    closeOnScrim?: boolean;
    onclose?: () => void;
  }

  type Props =
    | (SharedProps & { title: string; 'aria-label'?: never })
    | (SharedProps & { title?: never; 'aria-label': string });

  const uid = $props.id();

  let {
    open = $bindable(false),
    placement = 'right',
    title,
    'aria-label': ariaLabel,
    footer,
    children,
    closeOnScrim = true,
    onclose
  }: Props = $props();

  const titleId = `sv-sheet-title-${uid}`;

  function close(): boolean {
    if (!open) return true;
    open = false;
    onclose?.();
    return true;
  }
  function onScrim(event: PointerEvent) {
    if (event.button === 0 && event.target === event.currentTarget && closeOnScrim) close();
  }

  const flyX = $derived(placement === 'right' ? 340 : -340);
</script>


{#if open}
  <div
    data-sv="sheet-scrim"
    data-placement={placement}
    transition:fade={{ duration: 220 }}
    onpointerdown={onScrim}
    role="presentation"
  >
    <div
      data-sv="sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : ariaLabel}
      tabindex="-1"
      transition:fly={{ x: flyX, duration: 300, easing: cubicOut }}
      use:trapFocus={close}
    >
      {#if title}
        <div data-sv="sheet-header">
          <span data-sv="sheet-title" id={titleId}>{title}</span>
        </div>
      {/if}
      <div data-sv="sheet-body">{@render children()}</div>
      {#if footer}
        <div data-sv="sheet-footer">{@render footer()}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  [data-sv='sheet-scrim'] {
    position: fixed;
    inset: 0;
    z-index: calc(var(--sv-z-overlay) + var(--sv-overlay-stack-index, 0));
    display: flex;
    align-items: stretch;
    background: rgba(0, 0, 0, 0.42);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  [data-placement='right'] { justify-content: flex-end; }
  [data-placement='left'] { justify-content: flex-start; }
  [data-sv='sheet'] {
    width: 340px;
    max-width: calc(100vw - 48px);
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    background: var(--sv-surface-1);
    outline: none;
  }
  [data-placement='right'] [data-sv='sheet'] {
    border-left: 1px solid var(--sv-border);
    box-shadow: -8px 0 28px rgba(0, 0, 0, 0.4);
  }
  [data-placement='left'] [data-sv='sheet'] {
    border-right: 1px solid var(--sv-border);
    box-shadow: 8px 0 28px rgba(0, 0, 0, 0.4);
  }
  [data-sv='sheet-header'] {
    padding: var(--sv-space-4) var(--sv-space-6);
    border-bottom: 1px solid var(--sv-border);
    background: var(--sv-surface-2);
  }
  [data-sv='sheet-title'] {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-lg);
    font-weight: var(--sv-font-weight-semibold);
    color: var(--sv-text-strong);
  }
  [data-sv='sheet-body'] {
    flex: 1;
    overflow: auto;
    padding: var(--sv-space-6);
    color: var(--sv-text);
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
  }
  [data-sv='sheet-footer'] {
    padding: var(--sv-space-4) var(--sv-space-6);
    border-top: 1px solid var(--sv-border);
    display: flex;
    justify-content: flex-end;
    gap: var(--sv-space-3);
  }
</style>
