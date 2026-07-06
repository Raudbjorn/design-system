<!--
  Link — inline redacted-underline link. External links open in a new
  tab with a small "↗" marker and a visually-hidden hint for screen
  readers; rel/target are set automatically.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";

  interface Props extends HTMLAnchorAttributes {
    /** Link destination. */
    href: string;
    /** Open in a new tab with rel="noopener noreferrer" and a marker. */
    external?: boolean;
    /** Link content. */
    children: Snippet;
  }

  let { href, external = false, children, ...rest }: Props = $props();
</script>

<a
  class="link"
  {href}
  target={external ? "_blank" : undefined}
  rel={external ? "noopener noreferrer" : undefined}
  {...rest}
>
  {@render children()}{#if external}<span aria-hidden="true" class="marker">↗</span><span class="visually-hidden"> (opens in new tab)</span>{/if}
</a>

<style>
  .link {
    color: var(--carter-link);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--carter-link) 55%, transparent);
    text-underline-offset: 3px;
    text-decoration-thickness: 1px;
    transition: text-decoration-thickness 90ms ease;
  }

  .link:hover,
  .link:focus-visible {
    text-decoration-color: var(--carter-link);
    text-decoration-thickness: 2px;
  }

  .link:focus-visible {
    outline: 2px solid var(--carter-focus);
    outline-offset: 2px;
  }

  .marker {
    margin-left: 0.15em;
    font-size: 0.85em;
  }

  .visually-hidden {
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

  @media (prefers-reduced-motion: reduce) {
    .link { transition: none; }
  }
</style>
