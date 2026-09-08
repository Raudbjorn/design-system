<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisNavList } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const items = [
    { href: '#the-threshold', label: 'The Threshold' },
    { href: '#the-reliquary', label: 'The Reliquary' },
    { href: '#the-bestiary', label: 'The Bestiary' },
    { href: '#the-cartulary', label: 'The Cartulary' }
  ];

  const { Story } = defineMeta({
    title: 'Vermis/Molecules/NavList',
    component: VermisNavList,
    argTypes: {
      items: { table: { disable: true } },
      activeHref: { control: 'select', options: items.map((item) => item.href) }
    },
    parameters: argosSingleMode
  });
</script>

<!-- Meta carries no default `activeHref` — Storybook's arg merge skips
     `undefined`, so a story wanting "no active item" must omit the key
     entirely rather than trying to override a meta default back to unset. -->

<Story name="Default" args={{ activeHref: '#the-reliquary' }}>
  {#snippet template(args)}
    <VermisNavList {...args} {items} />
  {/snippet}
</Story>

<Story name="No active section">
  {#snippet template(args)}
    <VermisNavList {...args} {items} />
  {/snippet}
</Story>
