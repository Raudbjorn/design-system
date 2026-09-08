<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisFramedImage, VermisStack } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  // Self-contained placeholder plate — an engraved-looking sigil, no network.
  const plate =
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#e7ddc7"/>
        <circle cx="100" cy="100" r="60" fill="none" stroke="#3a2f26" stroke-width="2"/>
        <circle cx="100" cy="100" r="38" fill="none" stroke="#8a5a34" stroke-width="1.5"/>
        <path d="M100 40 L112 88 L160 100 L112 112 L100 160 L88 112 L40 100 L88 88 Z" fill="#3a2f26" opacity="0.75"/>
      </svg>`
    );

  const { Story } = defineMeta({
    title: 'Vermis/Molecules/FramedImage',
    component: VermisFramedImage,
    args: { src: plate, alt: 'Engraved plate of the eightfold sigil', ratio: '1/1' },
    argTypes: {
      src: { control: 'text' },
      alt: { control: 'text' },
      ratio: { control: 'inline-radio', options: ['1/1', '4/3', '3/4'] },
      accent: { control: 'text' },
      caption: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Basic" />

<Story name="With caption" asChild>
  <VermisFramedImage src={plate} alt="Engraved plate of the eightfold sigil" ratio="1/1">
    {#snippet caption()}Plate VII — the eightfold sigil, after the Cartulary hand{/snippet}
  </VermisFramedImage>
</Story>

<Story name="Ratios" asChild>
  <VermisStack direction="row" gap={4} wrap align="start">
    <VermisFramedImage src={plate} alt="Square-cropped plate" ratio="1/1" />
    <VermisFramedImage src={plate} alt="Landscape-cropped plate" ratio="4/3" />
    <VermisFramedImage src={plate} alt="Portrait-cropped plate" ratio="3/4" />
  </VermisStack>
</Story>

<Story name="Accent" asChild>
  <VermisStack direction="row" gap={4} wrap align="start">
    <VermisFramedImage src={plate} alt="Default-accent plate" ratio="1/1" />
    <VermisFramedImage
      src={plate}
      alt="Crimson-accent plate"
      ratio="1/1"
      accent="var(--layform-accent-crimson-2)"
    />
  </VermisStack>
</Story>
