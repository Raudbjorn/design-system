// Mirrors src/stories/layout/Stack.stories.svelte — the story-local .box
// styles are inlined (story-scoped CSS can't ride along).
import * as React from 'react';
import { Avatar, Badge, Button, Kbd, Stack, StatCard, Text } from '@svnbjrn/design';

const specRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '6rem 1fr',
  alignItems: 'center',
  gap: 'var(--sv-space-4)',
};
const specLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--sv-font-mono)',
  fontSize: 'var(--sv-fs-xs)',
  color: 'var(--sv-text-faint)',
};
const SpecRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={specRowStyle}>
    <span style={specLabelStyle}>{label}</span>
    {children}
  </div>
);

const frameStyle: React.CSSProperties = {
  maxWidth: '24rem',
  padding: 'var(--sv-space-3)',
  border: '1px dashed var(--sv-border)',
  borderRadius: 'var(--sv-radius-md)',
};

export const Playground = () => (
  <Stack>
    <StatCard value="128" label="Deploys" />
    <Button variant="secondary">View logs</Button>
    <Badge tone="success">healthy</Badge>
    <Text size="sm" tone="muted">
      last push 3m ago · <Kbd>d</Kbd> to deploy
    </Text>
  </Stack>
);

export const Row = () => (
  <Stack direction="row" gap={3} align="center">
    <Avatar alt="Jellyfin" size="sm" />
    <Text mono size="sm">jellyfin :8096</Text>
    <Badge tone="success">up 41 days</Badge>
    <Text size="xs" tone="faint">v10.9 · hw transcode</Text>
    <Button size="sm" variant="ghost">Restart</Button>
  </Stack>
);

export const Wrapping = () => (
  <div style={frameStyle}>
    <Stack direction="row" gap={2} wrap>
      <Badge tone="accent">x265</Badge>
      <Badge>1080p</Badge>
      <Badge>bluray</Badge>
      <Badge>dts-hd</Badge>
      <Badge>hdr10</Badge>
      <Badge>atmos</Badge>
      <Badge>remux</Badge>
      <Badge>web-dl</Badge>
      <Badge>10bit</Badge>
      <Badge tone="warning">proper</Badge>
      <Badge>repack</Badge>
      <Badge>multi-sub</Badge>
      <Badge>truehd</Badge>
      <Badge>dv</Badge>
    </Stack>
  </div>
);

const GAP_STEPS = [0, 1, 2, 3, 4, 6, 8, 12];

export const GapScale = () => (
  <Stack gap={6}>
    {GAP_STEPS.map((step) => (
      <SpecRow key={step} label={`gap={${step}}`}>
        <Stack direction="row" gap={step}>
          <Badge>sonarr</Badge>
          <Badge>radarr</Badge>
          <Badge>prowlarr</Badge>
        </Stack>
      </SpecRow>
    ))}
  </Stack>
);
