<!--
  Implements layform Pattern 57 (In-Page Section Nav List). See
  patterns/02-component-patterns.md.
-->
<script lang="ts">
  interface NavItem {
    href: string;
    label: string;
  }

  interface Props {
    items: NavItem[];
    activeHref?: string;
  }

  let { items, activeHref }: Props = $props();
</script>

<nav data-sv="nav-list">
  <ul>
    {#each items as item (item.href)}
      <li>
        <a
          href={item.href}
          data-sv="nav-list-item"
          data-active={item.href === activeHref}
          aria-current={item.href === activeHref ? 'location' : undefined}
        >
          {item.label}
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  [data-sv='nav-list'] ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  /* Pattern 57: rule-separated rows, no per-row illustration or panel */
  [data-sv='nav-list'] li + li {
    border-top: var(--layform-border-hairline) solid var(--layform-register-rule);
  }

  [data-sv='nav-list-item'] {
    display: block;
    padding: var(--layform-space-1) var(--layform-space-2);
    border-inline-start: var(--layform-border-medium) solid transparent;
    color: var(--layform-ink);
    text-decoration: none;
    font-family: var(--layform-font-reading);
    font-weight: var(--layform-weight-reading-body);
  }

  /* Active row: a left-edge accent tick, never a color-only swap, per
     Pattern 57's own "not a color-only swap" requirement. */
  [data-sv='nav-list-item'][data-active='true'] {
    border-inline-start-color: var(--layform-accent);
    font-weight: var(--layform-weight-reading-strong);
  }
</style>
