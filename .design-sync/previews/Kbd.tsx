// Mirrors src/stories/atoms/Kbd.stories.svelte
import * as React from 'react';
import { Kbd, Stack, Text } from '@svnbjrn/design';

export const SingleKey = () => <Kbd>Esc</Kbd>;

export const Chords = () => (
  <Stack gap={3}>
    <Text>
      Quick-open is <Kbd>Ctrl</Kbd> + <Kbd>P</Kbd>, the palette is <Kbd>Ctrl</Kbd> +{' '}
      <Kbd>Shift</Kbd> + <Kbd>P</Kbd>.
    </Text>
    <Text>
      Chorded: <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> then <Kbd>T</Kbd> to switch themes.
    </Text>
  </Stack>
);
