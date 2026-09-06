<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterNavList } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const items = [
    { label: 'Case Log', href: '#case-log' },
    { label: 'Witness Statements', href: '#witnesses', active: true },
    { label: 'Evidence Board', href: '#evidence' },
    { label: 'Closed Files', href: '#closed' }
  ];

  const itemsNoActive = items.map((item) => ({ ...item, active: false }));

  const { Story } = defineMeta({
    title: 'Carter/Molecules/NavList',
    component: CarterNavList,
    args: { title: 'Case DG-1181' },
    argTypes: {
      title: { control: 'text' },
      items: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <CarterNavList {...args} {items} />
  {/snippet}
</Story>

<Story name="No active section">
  {#snippet template(args)}
    <CarterNavList {...args} items={itemsNoActive} />
  {/snippet}
</Story>

<Story name="Empty">
  {#snippet template(args)}
    <CarterNavList {...args} items={[]} />
  {/snippet}
</Story>
