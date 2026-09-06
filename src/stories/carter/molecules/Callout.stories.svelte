<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterCallout, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Molecules/Callout',
    component: CarterCallout,
    args: { kind: 'note', title: 'Filing Note' },
    argTypes: {
      kind: { control: 'inline-radio', options: ['note', 'warning', 'unnatural', 'directive'] },
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <CarterCallout {...args}>
      Routine filing. No follow-up required before the next quarterly review.
    </CarterCallout>
  {/snippet}
</Story>

<Story name="Kinds" asChild>
  <CarterStack direction="column" gap={4}>
    <CarterCallout kind="note" title="Filing Note">
      Routine filing. No follow-up required before the next quarterly review.
    </CarterCallout>
    <CarterCallout kind="warning" title="Caution">
      Site access requires a buddy system after dusk. Radio silence lasting more than ten minutes triggers recall.
    </CarterCallout>
    <CarterCallout kind="unnatural" title="Handler's Note">
      Witness maintains the silhouette had no shadow of its own, even under floodlight. Escalating to Majestic review.
    </CarterCallout>
    <CarterCallout kind="directive" title="Standing Order">
      All recovered material from the reach is to be logged and sealed before transport. No exceptions.
    </CarterCallout>
  </CarterStack>
</Story>
