// Mirrors src/stories/atoms/Text.stories.svelte
import * as React from 'react';
import { Stack, Text } from '@svnbjrn/design';

export const Default = () => (
  <Text>Every value is a --sv-* token; override any of them to re-skin.</Text>
);

export const Tones = () => (
  <Stack gap={2}>
    <Text tone="strong">strong — headings' companion, the loudest ink</Text>
    <Text>default — body copy sits here</Text>
    <Text tone="muted">muted — labels, captions, secondary detail</Text>
    <Text tone="faint">faint — the quietest legible step, still AA</Text>
  </Stack>
);

export const Sizes = () => (
  <Stack gap={2}>
    <Text size="lg">lg — a lede or deck</Text>
    <Text size="base">base — 1rem body</Text>
    <Text size="sm">sm — dense UI copy</Text>
    <Text size="xs">xs — fine print and gutters</Text>
  </Stack>
);

export const Mono = () => (
  <Text mono>curl -H 'X-Api-Key: …' http://127.0.0.1:8989/api/v3/system/status</Text>
);
