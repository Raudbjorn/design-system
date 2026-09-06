<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterLink, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/Link',
    component: CarterLink,
    argTypes: {
      href: { control: 'text' },
      external: { control: 'boolean' },
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<!-- Link's only required prop is `children`, a Snippet, so it isn't
     Controls-drivable — every story here goes straight to `asChild`, same
     as core's NavBar.stories.svelte. -->

<Story name="Internal" asChild>
  <CarterLink href="#case-log-04b">Internal case log</CarterLink>
</Story>

<Story name="External" asChild>
  <CarterLink href="https://example.com/redacted-source" external>Redacted source</CarterLink>
</Story>

<Story name="Dossier theme" asChild>
  <div data-carter-theme="dossier" style="padding: 1rem; background: var(--carter-bg); color: var(--carter-text);">
    <CarterStack direction="row" gap={4} align="center" wrap>
      <CarterLink href="#case-log-04b">Internal case log</CarterLink>
      <CarterLink href="https://example.com/redacted-source" external>Redacted source</CarterLink>
    </CarterStack>
  </div>
</Story>
