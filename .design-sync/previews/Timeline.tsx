// Mirrors src/stories/molecules/Timeline.stories.svelte
import * as React from 'react';
import { Timeline } from '@svnbjrn/design';

const basicItems = [
  { title: '12:01', content: 'DNS zones reloaded' },
  { title: '12:04', content: 'Sonarr RSS sync finished' },
  { title: '12:10', content: 'nginx config validated' }
];

const statusItems = [
  { title: 'tailscale', content: 'Mesh healthy', color: 'success' },
  { title: 'openvino', content: 'Arc A770 warm-up', loading: true },
  { title: 'nginx', content: '502 upstream', color: 'error' },
  { title: 'meilisearch', content: 'Indexing complete', color: 'success' }
];

export const Basic = () => <Timeline items={basicItems} />;

export const Status = () => (
  <Timeline items={statusItems} variant="filled" />
);

export const Reverse = () => <Timeline items={basicItems} reverse />;
