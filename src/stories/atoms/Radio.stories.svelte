<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Radio, Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Radio',
    component: Radio,
    argTypes: {
      children: { table: { disable: true } },
      onchange: { table: { disable: true } }
    }
  });
</script>

<script lang="ts">
  let group = $state('sycl');
</script>

<Story name="Group" asChild>
  <Stack gap={3}>
    <Radio bind:group name="backend" value="sycl">SYCL (Arc A770)</Radio>
    <Radio bind:group name="backend" value="vulkan">Vulkan</Radio>
    <Radio bind:group name="backend" value="cpu">CPU</Radio>
  </Stack>
</Story>
