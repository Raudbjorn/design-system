// Mirrors src/stories/layout/Stack.stories.svelte — the story-local .box
// styles are inlined (story-scoped CSS can't ride along).
import * as React from 'react';
import { Stack } from '@svnbjrn/design';

const boxStyle: React.CSSProperties = {
  padding: 'var(--sv-space-2) var(--sv-space-3)',
  background: 'var(--sv-surface-2)',
  border: '1px solid var(--sv-border)',
  borderRadius: 'var(--sv-radius-sm)',
  fontFamily: 'var(--sv-font-mono)',
  fontSize: 'var(--sv-fs-sm)',
  color: 'var(--sv-text)',
};
const Box = ({ children }: { children: React.ReactNode }) => <div style={boxStyle}>{children}</div>;

export const Playground = () => (
  <Stack>
    <Box>one</Box>
    <Box>two</Box>
    <Box>three</Box>
  </Stack>
);

export const Row = () => (
  <Stack direction="row" gap={3} align="center">
    <Box>sonarr :8989</Box>
    <Box>radarr :7878</Box>
    <Box>jellyfin :8096</Box>
  </Stack>
);

export const Wrapping = () => (
  <Stack direction="row" gap={2} wrap>
    {Array.from({ length: 14 }, (_, i) => (
      <Box key={i}>chunk-{i}</Box>
    ))}
  </Stack>
);
