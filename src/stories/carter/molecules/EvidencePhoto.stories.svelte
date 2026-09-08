<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterEvidencePhoto, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Molecules/EvidencePhoto',
    component: CarterEvidencePhoto,
    args: {
      alt: 'Recovered Polaroid, site B',
      caption: 'Recovered Polaroid, site B',
      stamp: 'EXHIBIT 3',
      angle: -2,
      pinned: false
    },
    argTypes: {
      src: { control: 'text' },
      angle: { control: { type: 'range', min: -15, max: 15, step: 1 } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" />

<Story name="Pinned" args={{ pinned: true }} />

<Story name="No stamp" asChild>
  <CarterEvidencePhoto alt="Treeline, north ridge" caption="Treeline, north ridge — unmarked" />
</Story>

<Story name="Gallery" asChild>
  <CarterStack direction="row" gap={5} wrap>
    <CarterEvidencePhoto alt="Recovered Polaroid, site B" caption="Recovered Polaroid, site B" stamp="EXHIBIT 3" angle={-3} />
    <CarterEvidencePhoto alt="Treeline, north ridge" caption="Treeline, north ridge — unmarked" angle={4} />
    <CarterEvidencePhoto alt="Motel register, page torn" caption="Motel register, page torn" stamp="EXHIBIT 7" pinned />
  </CarterStack>
</Story>
