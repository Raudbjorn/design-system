<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Timeline } from '../../lib/index';

  const basicItems = [
    { title: '12:01', content: 'DNS zones reloaded' },
    { title: '12:04', content: 'Sonarr RSS sync finished' },
    { title: '12:10', content: 'nginx config validated' }
  ];

  const statusItems = [
    { title: 'tailscale', content: 'Mesh healthy', color: 'success' },
    { title: 'openvino', content: 'Arc A770 warm-up', loading: true },
    { title: 'nginx', content: '502 upstream', color: 'error' },
    { title: 'meilisearch', content: 'Indexing complete', color: 'success' }
  ];

  const { Story } = defineMeta({
    title: 'Molecules/Timeline',
    component: Timeline
  });
</script>

<Story name="Basic">
  {#snippet template(args)}
    <Timeline {...args} items={basicItems} />
  {/snippet}
</Story>

<Story name="Status">
  {#snippet template(args)}
    <Timeline {...args} items={statusItems} variant="filled" />
  {/snippet}
</Story>

<Story name="Reverse">
  {#snippet template(args)}
    <Timeline {...args} items={basicItems} reverse />
  {/snippet}
</Story>
