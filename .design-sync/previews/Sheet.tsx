// Mirrors src/stories/molecules/Sheet.stories.svelte
import * as React from 'react';
import { Button, Sheet, Text } from '@svnbjrn/design';

export const Right = () => (
  <Sheet
    open
    title="Transcoding"
    placement="right"
    footer={
      <>
        <Button variant="ghost" size="sm">Close</Button>
        <Button size="sm">Save</Button>
      </>
    }
  >
    <Text>A modal sheet that slides from the edge over a blurred backdrop.</Text>
  </Sheet>
);

export const Left = () => (
  <Sheet
    open
    title="Filter by status"
    placement="left"
    footer={
      <>
        <Button variant="ghost" size="sm">Reset</Button>
        <Button size="sm">Apply</Button>
      </>
    }
  >
    <Text>Drawer-style sheet from the opposite edge — useful for filter panels.</Text>
  </Sheet>
);
