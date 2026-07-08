<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Select } from '../../lib/index';

  const options = [
    { value: 'sveinbjorn', label: 'sveinbjorn' },
    { value: 'vinbonesjr', label: 'vinbonesjr' },
    { value: 'd4ll', label: 'd4ll' }
  ];

  const { Story } = defineMeta({
    title: 'Atoms/Select',
    component: Select,
    args: { id: 'host', label: 'Target host', options },
    argTypes: { onchange: { table: { disable: true } } }
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <Select {...args} />
  {/snippet}
</Story>
