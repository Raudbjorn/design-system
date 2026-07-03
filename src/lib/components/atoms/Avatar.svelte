<script lang="ts">
  interface Props {
    src?: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { src, alt, size = 'md' }: Props = $props();

  const initials = $derived(
    alt
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  );
</script>

{#if src}
  <img {src} {alt} data-sv="avatar" data-size={size} />
{:else}
  <span data-sv="avatar" data-size={size} role="img" aria-label={alt}>{initials}</span>
{/if}

<style>
  [data-sv='avatar'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    object-fit: cover;
    background: var(--sv-surface-3);
    color: var(--sv-text-strong);
    font-family: var(--sv-font-sans);
    font-weight: var(--sv-font-weight-semibold);
    overflow: hidden;
  }
  [data-size='sm'] { width: 1.75rem; height: 1.75rem; font-size: var(--sv-fs-xs); }
  [data-size='md'] { width: 2.5rem; height: 2.5rem; font-size: var(--sv-fs-sm); }
  [data-size='lg'] { width: 4rem; height: 4rem; font-size: var(--sv-fs-lg); }
</style>
