<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Breadcrumb } from '../../lib/index';

  const items = [
    { label: 'services', href: '/' },
    { label: 'media', href: '/media' },
    { label: 'jellyfin' }
  ];

  const { Story } = defineMeta({
    title: 'Molecules/Breadcrumb',
    component: Breadcrumb
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <Breadcrumb {...args} {items} />
  {/snippet}
</Story>
