// Mirrors src/stories/atoms/Checkbox.stories.svelte
import * as React from 'react';
import { Checkbox, Stack } from '@svnbjrn/design';

export const Default = () => (
  <Checkbox>Run migrations before deploy</Checkbox>
);

export const States = () => (
  <Stack gap={3}>
    <Checkbox checked>Observability</Checkbox>
    <Checkbox>Nightly backups</Checkbox>
    <Checkbox disabled>Hardware HSM — unavailable</Checkbox>
  </Stack>
);
