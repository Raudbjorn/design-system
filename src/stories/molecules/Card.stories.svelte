<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Badge, Button, Card, Heading, Stack, Text } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Molecules/Card',
    component: Card,
    args: { padding: 'md', elevated: false },
    argTypes: {
      padding: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
      children: { table: { disable: true } },
      header: { table: { disable: true } },
      footer: { table: { disable: true } }
    }
  });
</script>

<Story name="Basic">
  {#snippet template({ children: _, ...args })}
    <Card {...args}>
      <Text>
        Surface-1 on the token background, one border, one radius. Cards don't cast shadows
        unless you ask.
      </Text>
    </Card>
  {/snippet}
</Story>

<Story name="With header & footer">
  {#snippet template({ children: _, ...args })}
    <Card {...args}>
      {#snippet header()}
        <Stack direction="row" gap={3} align="center" justify="between">
          <Heading level={4}>nginx → tailscale</Heading>
          <Badge tone="success">healthy</Badge>
        </Stack>
      {/snippet}
      <Text>
        Binds the Tailscale IP after <Text as="span" mono size="sm">network-online.target</Text>;
        restarts on failure with a 5s backoff.
      </Text>
      {#snippet footer()}
        <Stack direction="row" gap={3} justify="end">
          <Button variant="ghost" size="sm">View unit</Button>
          <Button variant="secondary" size="sm">Restart</Button>
        </Stack>
      {/snippet}
    </Card>
  {/snippet}
</Story>

<Story name="Elevated" args={{ elevated: true }}>
  {#snippet template({ children: _, ...args })}
    <Card {...args}>
      <Text>--sv-shadow-md, for the one card per view that needs to float.</Text>
    </Card>
  {/snippet}
</Story>

<Story name="Padding scale" asChild>
  <Stack gap={4}>
    <Card padding="sm"><Text size="sm">sm — dense dashboards</Text></Card>
    <Card padding="md"><Text size="sm">md — the default</Text></Card>
    <Card padding="lg"><Text size="sm">lg — feature panels</Text></Card>
  </Stack>
</Story>
