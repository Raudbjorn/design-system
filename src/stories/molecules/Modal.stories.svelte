<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button, Modal, Text } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Molecules/Modal',
    component: Modal,
    argTypes: {
      children: { table: { disable: true } },
      footer: { table: { disable: true } },
      onclose: { table: { disable: true } }
    }
  });
</script>

<script lang="ts">
  let interactive = $state(false);
</script>

<Story name="Open">
  <Modal open title="Service settings">
    <Text>Tailscale IP, restart policy, and dependency order.</Text>
    {#snippet footer()}
      <Button variant="ghost" size="sm">Cancel</Button>
      <Button size="sm">Save</Button>
    {/snippet}
  </Modal>
</Story>

<Story name="Interactive" asChild>
  <div>
    <Button onclick={() => (interactive = true)}>Open modal</Button>
    <Modal bind:open={interactive} title="Service settings">
      <Text>Tailscale IP, restart policy, and dependency order.</Text>
      {#snippet footer()}
        <Button variant="ghost" size="sm" onclick={() => (interactive = false)}>Cancel</Button>
        <Button size="sm" onclick={() => (interactive = false)}>Save</Button>
      {/snippet}
    </Modal>
  </div>
</Story>
