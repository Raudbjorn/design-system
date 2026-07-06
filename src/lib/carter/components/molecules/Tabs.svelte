<!--
  Tabs — manila-folder tab set. Implements the WAI-ARIA tabs pattern
  with roving tabindex; Left/Right/Home/End move the selection, the
  active tab visually connects to the panel below it.
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  interface TabItem {
    id: string;
    label: string;
  }

  interface Props {
    /** Tab definitions, in order. */
    tabs?: TabItem[];
    /** Bindable id of the active tab; defaults to the first tab. */
    active?: string;
    /** Content for the active panel. */
    children?: Snippet;
  }

  const uid = $props.id();

  let { tabs = [], active = $bindable(tabs[0]?.id ?? ""), children }: Props = $props();

  let tabEls: (HTMLButtonElement | null)[] = $state([]);

  function select(id: string) {
    active = id;
  }

  function onKeydown(event: KeyboardEvent, index: number) {
    if (!tabs.length) return;
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;

    const nextTab = tabs[next];
    if (!nextTab) return;

    event.preventDefault();
    active = nextTab.id;
    tabEls[next]?.focus();
  }
</script>

<div class="tabs">
  <div class="tablist" role="tablist" aria-orientation="horizontal">
    {#each tabs as tab, i (tab.id)}
      <button
        bind:this={tabEls[i]}
        type="button"
        role="tab"
        id={`carter-tab-${uid}-${tab.id}`}
        aria-selected={tab.id === active}
        aria-controls={`carter-panel-${uid}-${tab.id}`}
        tabindex={tab.id === active ? 0 : -1}
        data-active={tab.id === active ? "true" : undefined}
        onclick={() => select(tab.id)}
        onkeydown={(event) => onKeydown(event, i)}
      >
        {tab.label}
      </button>
    {/each}
  </div>
  {#if tabs.length}
    <div
      class="panel"
      role="tabpanel"
      id={`carter-panel-${uid}-${active}`}
      aria-labelledby={`carter-tab-${uid}-${active}`}
      tabindex="0"
    >
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .tabs {
    display: flex;
    flex-direction: column;
    font-family: var(--carter-font-mono);
  }

  .tablist {
    display: flex;
    gap: var(--carter-space-1);
    padding: 0 var(--carter-space-2);
  }

  .tablist button {
    appearance: none;
    font: inherit;
    font-size: var(--carter-fs-xs);
    font-weight: var(--carter-weight-strong);
    text-transform: uppercase;
    letter-spacing: var(--carter-tracking-label);
    color: var(--carter-text-muted);
    background: var(--carter-surface);
    border: var(--carter-border-rule) solid var(--carter-border-strong);
    border-bottom: none;
    border-radius: var(--carter-radius-md) var(--carter-radius-md) 0 0;
    clip-path: polygon(6% 0, 94% 0, 100% 100%, 0% 100%);
    padding: var(--carter-space-2) var(--carter-space-4) var(--carter-space-3);
    margin-bottom: -2px;
    cursor: pointer;
    transition:
      color 90ms ease,
      background 90ms ease;
  }

  .tablist button:hover {
    color: var(--carter-text);
  }

  .tablist button:focus-visible {
    outline: 2px solid var(--carter-focus);
    outline-offset: 2px;
  }

  .tablist button[data-active="true"] {
    position: relative;
    z-index: var(--carter-z-frame);
    color: var(--carter-text);
    background: var(--carter-surface-raise);
  }

  .panel {
    padding: var(--carter-space-4);
    background: var(--carter-surface-raise);
    border: var(--carter-border-rule) solid var(--carter-border-strong);
    border-radius: 0 var(--carter-radius-md) var(--carter-radius-md) var(--carter-radius-md);
  }

  .panel:focus-visible {
    outline: 2px solid var(--carter-focus);
    outline-offset: -2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .tablist button { transition: none; }
  }
</style>
