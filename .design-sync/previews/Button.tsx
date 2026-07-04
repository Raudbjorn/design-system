// Mirrors src/stories/atoms/Button.stories.svelte
import * as React from 'react';
import { Button, Stack } from '@svnbjrn/design';

export const Primary = () => <Button variant="primary">Deploy</Button>;

export const Variants = () => (
  <Stack direction="row" gap={3} align="center" wrap>
    <Button variant="primary">Deploy</Button>
    <Button variant="secondary">Dry run</Button>
    <Button variant="ghost">View logs</Button>
    <Button variant="danger">Destroy droplet</Button>
  </Stack>
);

export const Sizes = () => (
  <Stack direction="row" gap={3} align="center" wrap>
    <Button size="sm">Retry</Button>
    <Button size="md">Retry</Button>
    <Button size="lg">Retry</Button>
  </Stack>
);

export const States = () => (
  <Stack direction="row" gap={3} align="center" wrap>
    <Button disabled>Deploy</Button>
    <Button loading>Deploying…</Button>
  </Stack>
);

export const AsLink = () => (
  <Button href="#docs" variant="secondary">Read the docs</Button>
);
