<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Checkbox, Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Checkbox',
    component: Checkbox,
    args: { checked: false, disabled: false },
    argTypes: {
      children: { table: { disable: true } },
      onchange: { table: { disable: true } }
    }
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <Checkbox {...args}>Run migrations before deploy</Checkbox>
  {/snippet}
</Story>

<Story name="States" asChild>
  <Stack gap={3}>
    <Checkbox checked>Observability</Checkbox>
    <Checkbox>Nightly backups</Checkbox>
    <Checkbox disabled>Hardware HSM — unavailable</Checkbox>
  </Stack>
</Story>
