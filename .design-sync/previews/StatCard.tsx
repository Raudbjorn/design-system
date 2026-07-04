// Mirrors src/stories/molecules/StatCard.stories.svelte
import * as React from 'react';
import { Stack, StatCard } from '@svnbjrn/design';

export const Default = () => <StatCard value="128" label="deploys this quarter" tone="accent" />;

export const DashboardRow = () => (
  <Stack direction="row" gap={4} wrap>
    <StatCard value="99.98%" label="uptime, 30 days" />
    <StatCard value="212ms" label="p95 latency" tone="default" />
    <StatCard value="3" label="incidents open" tone="accent-2" />
  </Stack>
);
