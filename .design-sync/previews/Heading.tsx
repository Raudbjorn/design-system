// Mirrors src/stories/atoms/Heading.stories.svelte
import * as React from 'react';
import { Heading, Stack } from '@svnbjrn/design';

export const Default = () => <Heading level={1}>Sveinbjörn</Heading>;

export const Ramp = () => (
  <Stack gap={4}>
    <Heading level={1}>h1 · Sveinbjörn</Heading>
    <Heading level={2}>h2 · Þingvellir</Heading>
    <Heading level={3}>h3 · Reykjavík</Heading>
    <Heading level={4}>h4 · Ísafjörður</Heading>
  </Stack>
);
