<!--
  BriefingLayout — an operation briefing page. A classification banner runs
  across the top; a file-index sidebar, main body column, and an optional
  margin-annotations aside are laid out in a responsive CSS grid.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import ClassificationBanner from "../atoms/ClassificationBanner.svelte";
  import Heading from "../atoms/Heading.svelte";
  import NavList from "../molecules/NavList.svelte";

  interface NavItem {
    label: string;
    href: string;
    active?: boolean;
  }

  interface Props {
    /** Briefing title, rendered as the main heading. */
    title: string;
    /** Classification level for the top banner. */
    classification?: string;
    /** Compartment / caveat. */
    caveat?: string;
    /** File-index sidebar entries. */
    nav?: NavItem[];
    /** Margin annotations rendered in the aside column. */
    notes?: Snippet;
    /** Main body content. */
    children: Snippet;
  }

  let { title, classification = "TOP SECRET", caveat, nav = [], notes, children }: Props = $props();
</script>

<div class="briefing">
  <ClassificationBanner level={classification} {caveat} />

  <div class="layout" class:layout--annotated={Boolean(notes)}>
    <div class="sidebar">
      <NavList items={nav} title="FILE INDEX" />
    </div>

    <main class="body">
      <Heading level={1}>{title}</Heading>
      {@render children()}
    </main>

    {#if notes}
      <aside class="notes" aria-label="Margin annotations">
        {@render notes()}
      </aside>
    {/if}
  </div>
</div>

<style>
  .briefing {
    display: flex;
    flex-direction: column;
    background: var(--carter-bg);
    color: var(--carter-text);
  }

  .layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--carter-space-6);
    padding: var(--carter-space-6) var(--carter-space-5);
  }

  .sidebar,
  .body,
  .notes {
    min-width: 0;
  }

  .notes {
    padding-top: var(--carter-space-4);
    border-top: var(--carter-border-hair) solid var(--carter-border);
    font-family: var(--carter-font-mono);
    font-size: var(--carter-fs-sm);
    color: var(--carter-text-muted);
  }

  @media (min-width: 48rem) {
    .layout {
      grid-template-columns: 14rem minmax(0, 1fr);
      align-items: start;
    }
    .layout--annotated {
      grid-template-columns: 14rem minmax(0, 1fr) 16rem;
    }
    .notes {
      padding-top: 0;
      padding-left: var(--carter-space-5);
      border-top: none;
      border-left: var(--carter-border-hair) solid var(--carter-border);
    }
  }
</style>
