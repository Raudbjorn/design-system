<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Spinner, Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Spinner',
    component: Spinner,
    args: { size: 'md' },
    argTypes: {
      size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }
    }
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <Spinner {...args} />
  {/snippet}
</Story>

<Story name="Sizes" asChild>
  <Stack direction="row" gap={4} align="center">
    <Spinner size="sm" />
    <Spinner size="md" />
    <Spinner size="lg" />
  </Stack>
</Story>
