<script lang="ts">
  interface Props {
    size?: 'sm' | 'md' | 'lg';
    /** Accessible name for the busy state. */
    label?: string;
  }

  let { size = 'md', label = 'Loading' }: Props = $props();
</script>

<span
  data-sv="spinner"
  data-size={size}
  role="status"
  aria-label={label}
></span>

<style>
  [data-sv='spinner'] {
    display: inline-block;
    box-sizing: border-box;
    border-radius: 50%;
    border: 2px solid var(--sv-border);
    border-top-color: var(--sv-accent);
    animation: sv-spinner 0.7s linear infinite;
  }
  [data-size='sm'] { width: 16px; height: 16px; border-width: 2px; }
  [data-size='md'] { width: 24px; height: 24px; border-width: 3px; }
  [data-size='lg'] { width: 36px; height: 36px; border-width: 3px; }

  @keyframes sv-spinner {
    to { transform: rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-sv='spinner'] { animation: none; }
  }
</style>
