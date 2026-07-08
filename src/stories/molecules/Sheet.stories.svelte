<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Button, Sheet, Text } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Molecules/Sheet',
    component: Sheet,
    argTypes: {
      children: { table: { disable: true } },
      footer: { table: { disable: true } },
      onclose: { table: { disable: true } }
    }
  });
</script>


<Story name="Right">
  <Sheet open title="Transcoding" placement="right">
    <Text>A modal sheet that slides from the edge over a blurred backdrop.</Text>
    {#snippet footer()}
      <Button variant="ghost" size="sm">Close</Button>
      <Button size="sm">Save</Button>
    {/snippet}
  </Sheet>
</Story>

<Story name="Left" asChild>
  <Sheet open title="Filter by status" placement="left">
    <Text>Drawer-style sheet from the opposite edge — useful for filter panels.</Text>
    {#snippet footer()}
      <Button variant="ghost" size="sm">Reset</Button>
      <Button size="sm">Apply</Button>
    {/snippet}
  </Sheet>
</Story>
