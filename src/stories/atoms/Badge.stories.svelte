<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Badge, Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Badge',
    component: Badge,
    args: { tone: 'neutral' },
    argTypes: {
      tone: {
        control: 'inline-radio',
        options: ['neutral', 'success', 'error', 'warning', 'accent']
      },
      children: { table: { disable: true } }
    }
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <Badge {...args}>v0.0.0</Badge>
  {/snippet}
</Story>

<Story name="Tones" asChild>
  <Stack direction="row" gap={3} align="center" wrap>
    <Badge>queued</Badge>
    <Badge tone="success">passing</Badge>
    <Badge tone="error">failed</Badge>
    <Badge tone="warning">degraded</Badge>
    <Badge tone="accent">main</Badge>
  </Stack>
</Story>
