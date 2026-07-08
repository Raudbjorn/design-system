// Mirrors src/stories/atoms/Tooltip.stories.svelte
import * as React from 'react';
import { Button, Tooltip } from '@svnbjrn/design';

export const Default = () => (
  <Tooltip content="Copy to clipboard" placement="top">
    <Button variant="ghost" size="sm">Copy</Button>
  </Tooltip>
);
