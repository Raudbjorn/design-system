<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterTerminal } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const lines = [
    'query case DG-1181',
    'access granted — clearance: majestic-12',
    'retrieving field report...',
    '3 witnesses on record. 0 corroborate.',
    'do not file as "coyote."'
  ];

  const { Story } = defineMeta({
    title: 'Carter/Molecules/Terminal',
    component: CarterTerminal,
    args: { prompt: '>', typing: false, speed: 28 },
    argTypes: {
      prompt: { control: 'text' },
      typing: { control: 'boolean' },
      speed: { control: { type: 'number', min: 4, max: 200, step: 1 } },
      lines: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<!-- `typing: false` here renders every line immediately for a deterministic
     screenshot; see "Typing" below for the component's real (animated)
     default. -->
<Story name="Default">
  {#snippet template(args)}
    <CarterTerminal {...args} {lines} />
  {/snippet}
</Story>

<Story name="Typing" args={{ typing: true }}>
  {#snippet template(args)}
    <CarterTerminal {...args} {lines} />
  {/snippet}
</Story>
