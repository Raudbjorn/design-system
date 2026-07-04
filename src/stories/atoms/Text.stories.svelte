<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Stack, Text } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Text',
    component: Text,
    args: { size: 'base', tone: 'default', mono: false, as: 'p' },
    argTypes: {
      size: { control: 'inline-radio', options: ['xs', 'sm', 'base', 'lg'] },
      tone: { control: 'inline-radio', options: ['default', 'strong', 'muted', 'faint'] },
      as: { control: 'inline-radio', options: ['p', 'span', 'div'] },
      children: { table: { disable: true } }
    }
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <Text {...args}>Every value is a --sv-* token; override any of them to re-skin.</Text>
  {/snippet}
</Story>

<Story name="Tones" asChild>
  <Stack gap={2}>
    <Text tone="strong">strong — headings' companion, the loudest ink</Text>
    <Text>default — body copy sits here</Text>
    <Text tone="muted">muted — labels, captions, secondary detail</Text>
    <Text tone="faint">faint — the quietest legible step, still AA</Text>
  </Stack>
</Story>

<Story name="Sizes" asChild>
  <Stack gap={2}>
    <Text size="lg">lg — a lede or deck</Text>
    <Text size="base">base — 1rem body</Text>
    <Text size="sm">sm — dense UI copy</Text>
    <Text size="xs">xs — fine print and gutters</Text>
  </Stack>
</Story>

<Story name="Mono" args={{ mono: true }}>
  {#snippet template({ children: _, ...args })}
    <Text {...args}>curl -H 'X-Api-Key: …' http://127.0.0.1:8989/api/v3/system/status</Text>
  {/snippet}
</Story>
