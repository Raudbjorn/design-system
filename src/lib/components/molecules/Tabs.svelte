<script lang="ts">
  interface Tab {
    id: string;
    label: string;
    /** DOM id for this tab button. */
    tabId: string;
    /** DOM id of the consumer-rendered tabpanel. */
    panelId: string;
  }

  interface Props {
    tabs: Tab[];
    /** The active tab id (two-way). */
    value?: string;
    onchange?: (id: string) => void;
    /** Accessible name for the tab list. */
    'aria-label'?: string;
  }

  let {
    tabs,
    value = $bindable(),
    onchange,
    'aria-label': ariaLabel = 'Tabs'
  }: Props = $props();

  const selectedId = $derived(
    tabs.some((tab) => tab.id === value) ? value : tabs[0]?.id
  );

  $effect(() => {
    if (selectedId === undefined || selectedId === value) return;
    value = selectedId;
    onchange?.(selectedId);
  });

  function select(id: string) {
    value = id;
    onchange?.(id);
  }

  function keyNav(e: KeyboardEvent, i: number) {
    const n = tabs.length;
    let j = i;
    if (e.key === 'ArrowRight') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    else return;
    e.preventDefault();
    const next = tabs[j];
    if (!next) return;
    select(next.id);
    const btns = (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[data-sv="tab"]');
    btns?.[j]?.focus();
  }
</script>

<div data-sv="tabs" role="tablist" aria-label={ariaLabel}>
  {#each tabs as t, i (t.id)}
    <button
      type="button"
      role="tab"
      id={t.tabId}
      aria-controls={t.panelId}
      aria-selected={selectedId === t.id}
      tabindex={selectedId === t.id ? 0 : -1}
      data-sv="tab"
      data-active={selectedId === t.id}
      onclick={() => select(t.id)}
      onkeydown={(e) => keyNav(e, i)}
    >
      {t.label}
    </button>
  {/each}
</div>

<style>
  [data-sv='tabs'] {
    display: flex;
    gap: var(--sv-space-1);
    border-bottom: 1px solid var(--sv-border);
  }
  [data-sv='tab'] {
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--sv-space-2) var(--sv-space-4);
    margin-bottom: -1px;
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-sm);
    color: var(--sv-text-muted);
    border-bottom: 2px solid transparent;
    transition: color 0.12s ease, border-color 0.12s ease;
  }
  [data-sv='tab']:hover { color: var(--sv-text); }
  [data-active='true'] {
    color: var(--sv-text-strong);
    font-weight: var(--sv-font-weight-medium);
    border-bottom-color: var(--sv-accent);
  }
  [data-sv='tab']:focus-visible {
    outline: 2px solid var(--sv-accent);
    outline-offset: -2px;
    border-radius: var(--sv-radius-sm);
  }
</style>
