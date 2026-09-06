<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterRedaction } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/Redaction',
    component: CarterRedaction,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Redacted" asChild>
  <p>
    The subject was last seen entering <CarterRedaction reveal={false}>a disused grain silo outside Blackwood</CarterRedaction>
    in the company of <CarterRedaction reveal={false}>Agent M. Okafor</CarterRedaction>.
  </p>
</Story>

<Story name="Revealable" asChild>
  <p>
    The subject was last seen entering <CarterRedaction reveal={true}>a disused grain silo outside Blackwood</CarterRedaction>
    — hover or focus to reveal.
  </p>
</Story>

<Story name="Locked" asChild>
  <p>
    Source identity is <CarterRedaction locked>permanently sealed under Executive Order 11110</CarterRedaction>
    and cannot be revealed by any clearance level.
  </p>
</Story>
