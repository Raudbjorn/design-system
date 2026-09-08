<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisCard, VermisCreditChip, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Molecules/Card',
    component: VermisCard,
    args: { variant: 'plain', featured: false, collapsible: false, defaultOpen: true },
    argTypes: {
      variant: { control: 'select', options: ['plain', 'callout', 'reversed'] },
      featured: { control: 'boolean' },
      collapsible: { control: 'boolean' },
      defaultOpen: { control: 'boolean' },
      media: { table: { disable: true } },
      heading: { table: { disable: true } },
      footer: { table: { disable: true } },
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Basic">
  {#snippet template({ children: _, ...args })}
    <VermisCard {...args}>
      {#snippet heading()}Of the Threshold Rites{/snippet}
      <p>
        The threshold does not open for the unannounced. Three knocks, spaced by a held
        breath, and the wax seal along the jamb will soften enough to admit a single
        supplicant.
      </p>
    </VermisCard>
  {/snippet}
</Story>

<Story
  name="Featured & collapsible"
  args={{ featured: true, collapsible: true, defaultOpen: false }}
>
  {#snippet template({ children: _, ...args })}
    <VermisCard {...args}>
      {#snippet heading()}The Sealed Reliquary{/snippet}
      <p>
        Kept shut for eleven generations, opened only when the wardens' ledger and the
        moon's account of nights agree.
      </p>
      {#snippet footer()}
        <VermisCreditChip>ward. 3rd circle</VermisCreditChip>
      {/snippet}
    </VermisCard>
  {/snippet}
</Story>

<Story name="Variants" asChild>
  <VermisStack direction="row" gap={4} wrap>
    <VermisCard variant="plain">
      {#snippet heading()}Plain{/snippet}
      <p>The base panel — one hairline border, parchment fill, reading voice throughout.</p>
    </VermisCard>
    <VermisCard variant="callout">
      {#snippet heading()}Callout{/snippet}
      <p>
        An inscription box: border-only, italic body, quoting an aside rather than
        stating it.
      </p>
    </VermisCard>
    <VermisCard variant="reversed">
      {#snippet heading()}Reversed{/snippet}
      <p>The louder narrative panel — accent fill, parchment ink, reserved for a turn.</p>
    </VermisCard>
  </VermisStack>
</Story>

<!-- `children` is optional — a header-only card (no body, no footer) is legal. -->
<Story name="Heading only" asChild>
  <VermisCard variant="callout">
    {#snippet heading()}Index of the Unread Volumes{/snippet}
  </VermisCard>
</Story>
