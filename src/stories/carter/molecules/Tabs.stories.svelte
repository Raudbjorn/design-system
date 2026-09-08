<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterTabs } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Molecules/Tabs',
    component: CarterTabs,
    args: {
      tabs: [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'evidence', label: 'Evidence' }
      ],
      active: 'overview'
    },
    argTypes: {
      tabs: { table: { disable: true } },
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <CarterTabs {...args}>
      <p>Field team lost contact with the Coldwater relay station at 02:14. No distress call logged.</p>
    </CarterTabs>
  {/snippet}
</Story>

<Story name="Timeline active" args={{ active: 'timeline' }}>
  {#snippet template({ children: _, ...args })}
    <CarterTabs {...args}>
      <p>01:58 — last routine check-in. 02:14 — relay goes dark. 06:40 — recovery team dispatched.</p>
    </CarterTabs>
  {/snippet}
</Story>
