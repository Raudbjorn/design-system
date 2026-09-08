<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterKicker, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/Kicker',
    component: CarterKicker,
    argTypes: {
      tone: { control: 'select', options: ['muted', 'primary', 'danger'] },
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<!-- Kicker's only required prop is `children`, a Snippet, so it isn't
     Controls-drivable — every story here goes straight to `asChild`, same
     as core's NavBar.stories.svelte. -->

<Story name="Muted" asChild>
  <CarterKicker>FILE 04-B</CarterKicker>
</Story>

<Story name="Tones" asChild>
  <CarterStack gap={2}>
    <CarterKicker tone="muted">FILE 04-B · UNCLASSIFIED</CarterKicker>
    <CarterKicker tone="primary">ACTIVE INVESTIGATION</CarterKicker>
    <CarterKicker tone="danger">CONTAINMENT BREACH</CarterKicker>
  </CarterStack>
</Story>

<Story name="Dossier theme" asChild>
  <div data-carter-theme="dossier" style="padding: 1rem; background: var(--carter-bg); color: var(--carter-text);">
    <CarterStack gap={2}>
      <CarterKicker tone="muted">FILE 04-B · UNCLASSIFIED</CarterKicker>
      <CarterKicker tone="primary">ACTIVE INVESTIGATION</CarterKicker>
      <CarterKicker tone="danger">CONTAINMENT BREACH</CarterKicker>
    </CarterStack>
  </div>
</Story>
