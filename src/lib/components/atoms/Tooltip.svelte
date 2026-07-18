<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    content: string;
    placement?: 'top' | 'bottom';
    children: Snippet;
  }

  let { content, placement = 'top', children }: Props = $props();

  const uid = $props.id();
  const tooltipId = `sv-tooltip-${uid}`;
  let hovered = $state(false);
  let focused = $state(false);
  let dismissed = $state(false);
  const open = $derived(!dismissed && (hovered || focused));
  let wrapEl = $state<HTMLElement | null>(null);

  function getTrigger(): Element | null {
    let trigger = wrapEl?.firstElementChild ?? null;
    while (trigger?.tagName === 'DS-SLOT') trigger = trigger.firstElementChild;
    return trigger;
  }

  function onMouseenter() {
    hovered = true;
    dismissed = false;
  }

  function onMouseleave() {
    hovered = false;
  }

  function onFocusin() {
    focused = true;
    dismissed = false;
  }

  function onFocusout(event: FocusEvent) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !wrapEl?.contains(next)) focused = false;
  }

  $effect(() => {
    const trigger = getTrigger();
    if (!(trigger instanceof Element)) return;

    const currentIds = (trigger.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .filter((id) => id !== tooltipId);

    if (open) {
      currentIds.push(tooltipId);
      trigger.setAttribute('aria-describedby', currentIds.join(' '));
      return () => {
        const nextIds = (trigger.getAttribute('aria-describedby') ?? '')
          .split(/\s+/)
          .filter(Boolean)
          .filter((id) => id !== tooltipId);
        if (nextIds.length > 0) trigger.setAttribute('aria-describedby', nextIds.join(' '));
        else trigger.removeAttribute('aria-describedby');
      };
    }

    if (currentIds.length > 0) trigger.setAttribute('aria-describedby', currentIds.join(' '));
    else trigger.removeAttribute('aria-describedby');
  });

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') dismissed = true;
  }
</script>

<span
  bind:this={wrapEl}
  data-sv="tooltip-wrap"
  role="presentation"
  onmouseenter={onMouseenter}
  onmouseleave={onMouseleave}
  onfocusin={onFocusin}
  onfocusout={onFocusout}
  onkeydown={onKeydown}
>
  {@render children()}
  {#if open}
    <span
      id={tooltipId}
      data-sv="tooltip"
      data-placement={placement}
      data-open={open}
      role="tooltip"
    >
      {content}
      <span data-sv="tooltip-arrow" aria-hidden="true"></span>
    </span>
  {/if}
</span>

<style>
  [data-sv='tooltip-wrap'] {
    position: relative;
    display: inline-flex;
  }
  [data-sv='tooltip'] {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    background: var(--sv-surface-3);
    color: var(--sv-text-strong);
    border: 1px solid var(--sv-border);
    box-shadow: var(--sv-shadow-md);
    padding: var(--sv-space-2) var(--sv-space-3);
    border-radius: var(--sv-radius-md);
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-xs);
    pointer-events: auto;
    opacity: 0;
    transition: opacity 0.12s ease;
    z-index: var(--sv-z-dropdown);
  }
  [data-placement='top'] { bottom: calc(100% + 8px); }
  [data-placement='bottom'] { top: calc(100% + 8px); }
  [data-open='true'] { opacity: 1; }
  [data-sv='tooltip-arrow'] {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
  }
  [data-placement='top'] [data-sv='tooltip-arrow'] {
    top: 100%;
    border-top-color: var(--sv-surface-3);
  }
  [data-placement='bottom'] [data-sv='tooltip-arrow'] {
    bottom: 100%;
    border-bottom-color: var(--sv-surface-3);
  }
</style>
