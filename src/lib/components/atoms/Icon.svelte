<script lang="ts">
  interface Props {
    glyph: string;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
  }

  let { glyph, label, size = 'md' }: Props = $props();
</script>

<span
  data-sv="icon"
  data-size={size}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
>{glyph}</span>

<style>
  [data-sv='icon'] {
    font-family: var(--sv-font-mono);
    line-height: 1;
    display: inline-block;
  }
  [data-size='sm'] { font-size: var(--sv-fs-sm); }
  [data-size='md'] { font-size: var(--sv-fs-base); }
  [data-size='lg'] { font-size: var(--sv-fs-lg); }
</style>
