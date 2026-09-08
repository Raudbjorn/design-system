<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterEvidenceBoard } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Templates/EvidenceBoard',
    component: CarterEvidenceBoard,
    args: {
      items: [
        { alt: 'Recovered Polaroid, site B', caption: 'Recovered Polaroid, site B', stamp: 'EXHIBIT 3', x: 18, y: 22 },
        { alt: 'Treeline, north ridge', caption: 'Treeline, north ridge — unmarked', x: 55, y: 15, angle: 5 },
        { alt: 'Motel register, page torn', caption: 'Motel register, page torn', stamp: 'EXHIBIT 7', x: 78, y: 55, angle: -6 },
        { alt: 'Relay station log', caption: 'Relay station log, final page', x: 32, y: 68, angle: 3 }
      ],
      connections: [
        [0, 1],
        [1, 2],
        [0, 3]
      ] as [number, number][]
    },
    argTypes: {
      items: { table: { disable: true } },
      connections: { table: { disable: true } }
    },
    parameters: { ...argosSingleMode, layout: 'fullscreen' }
  });
</script>

<Story name="Default" />

<Story
  name="Unpositioned scatter"
  args={{
    items: [
      { alt: 'Recovered Polaroid, site B', caption: 'Recovered Polaroid, site B', stamp: 'EXHIBIT 3' },
      { alt: 'Treeline, north ridge', caption: 'Treeline, north ridge — unmarked' },
      { alt: 'Motel register, page torn', caption: 'Motel register, page torn', stamp: 'EXHIBIT 7' }
    ],
    connections: [[0, 2]] as [number, number][]
  }}
/>
