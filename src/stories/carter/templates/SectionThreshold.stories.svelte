<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterSectionThreshold } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Templates/SectionThreshold',
    component: CarterSectionThreshold,
    args: {
      eyebrow: 'Part Two',
      title: 'The Coldwater Tapes',
      subtitle: 'What the second recorder caught, minute forty-one onward.',
      number: '02',
      tone: 'default'
    },
    argTypes: {
      tone: { control: 'inline-radio', options: ['default', 'mortal'] }
    },
    parameters: { ...argosSingleMode, layout: 'fullscreen' }
  });
</script>

<Story name="Default" />

<Story name="Mortal tone" args={{ tone: 'mortal' }} />
