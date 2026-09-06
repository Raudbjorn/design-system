<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterClassificationBanner, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/ClassificationBanner',
    component: CarterClassificationBanner,
    args: { level: 'TOP SECRET', caveat: 'SAR-DELTA GREEN', tone: 'classified' },
    argTypes: {
      tone: { control: 'select', options: ['classified', 'danger', 'warning', 'primary'] },
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template({ children: _, ...args })}
    <CarterClassificationBanner {...args} />
  {/snippet}
</Story>

<Story name="Tones" asChild>
  <CarterStack direction="column" gap={2}>
    <CarterClassificationBanner level="TOP SECRET" caveat="SAR-DELTA GREEN" tone="classified" />
    <CarterClassificationBanner level="EYES ONLY" caveat="ACTIVE THREAT" tone="danger" />
    <CarterClassificationBanner level="RESTRICTED" caveat="PENDING REVIEW" tone="warning" />
    <CarterClassificationBanner level="FOR OFFICIAL USE" caveat="CASE 88-114" tone="primary" />
  </CarterStack>
</Story>

<Story name="With routing marks" asChild>
  <CarterClassificationBanner level="TOP SECRET" caveat="SAR-DELTA GREEN">
    CASE NO. 88-114
  </CarterClassificationBanner>
</Story>
