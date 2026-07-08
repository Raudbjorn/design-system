// Mirrors src/stories/molecules/Modal.stories.svelte
import * as React from 'react';
import { Button, Modal, Text } from '@svnbjrn/design';

export const Open = () => (
  <Modal open title="Service settings">
    <Text>Tailscale IP, restart policy, and dependency order.</Text>
    <footer>
      <Button variant="ghost" size="sm">Cancel</Button>
      <Button size="sm">Save</Button>
    </footer>
  </Modal>
);

export const Interactive = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <Button onclick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onclose={() => setOpen(false)} title="Service settings">
        <Text>Tailscale IP, restart policy, and dependency order.</Text>
        <footer>
          <Button variant="ghost" size="sm" onclick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onclick={() => setOpen(false)}>
            Save
          </Button>
        </footer>
      </Modal>
    </div>
  );
};
