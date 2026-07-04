// Mirrors src/stories/molecules/Card.stories.svelte
import * as React from 'react';
import { Badge, Button, Card, Heading, Stack, Text } from '@svnbjrn/design';

export const Basic = () => (
  <Card>
    <Text>
      Surface-1 on the token background, one border, one radius. Cards don't cast shadows unless
      you ask.
    </Text>
  </Card>
);

export const WithHeaderFooter = () => (
  <Card
    header={
      <Stack direction="row" gap={3} align="center" justify="between">
        <Heading level={4}>nginx → tailscale</Heading>
        <Badge tone="success">healthy</Badge>
      </Stack>
    }
    footer={
      <Stack direction="row" gap={3} justify="end">
        <Button variant="ghost" size="sm">View unit</Button>
        <Button variant="secondary" size="sm">Restart</Button>
      </Stack>
    }
  >
    <Text>
      Binds the Tailscale IP after <Text as="span" mono size="sm">network-online.target</Text>;
      restarts on failure with a 5s backoff.
    </Text>
  </Card>
);

export const Elevated = () => (
  <Card elevated>
    <Text>--sv-shadow-md, for the one card per view that needs to float.</Text>
  </Card>
);

export const PaddingScale = () => (
  <Stack gap={4}>
    <Card padding="sm"><Text size="sm">sm — dense dashboards</Text></Card>
    <Card padding="md"><Text size="sm">md — the default</Text></Card>
    <Card padding="lg"><Text size="sm">lg — feature panels</Text></Card>
  </Stack>
);
