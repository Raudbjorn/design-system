// Mirrors src/stories/atoms/Badge.stories.svelte
import * as React from 'react';
import { Badge, Stack } from '@svnbjrn/design';

export const Default = () => <Badge>v0.0.0</Badge>;

export const Tones = () => (
  <Stack direction="row" gap={3} align="center" wrap>
    <Badge>queued</Badge>
    <Badge tone="success">passing</Badge>
    <Badge tone="error">failed</Badge>
    <Badge tone="warning">degraded</Badge>
    <Badge tone="accent">main</Badge>
  </Stack>
);
