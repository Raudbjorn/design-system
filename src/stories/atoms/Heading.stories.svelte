<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Heading, Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Heading',
    component: Heading,
    args: { level: 1 },
    argTypes: {
      level: { control: 'inline-radio', options: [1, 2, 3, 4] },
      children: { table: { disable: true } }
    }
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <Heading {...args}>Sveinbjörn</Heading>
  {/snippet}
</Story>

<Story name="Ramp" asChild>
  <Stack gap={4}>
    <Heading level={1}>h1 · Sveinbjörn</Heading>
    <Heading level={2}>h2 · Þingvellir</Heading>
    <Heading level={3}>h3 · Reykjavík</Heading>
    <Heading level={4}>h4 · Ísafjörður</Heading>
  </Stack>
</Story>
