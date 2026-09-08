<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisStatusTag } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Atoms/StatusTag',
    component: VermisStatusTag,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Draft" asChild>
  <VermisStatusTag status="draft">Unfinished Rite</VermisStatusTag>
</Story>

<Story name="Deprecated" asChild>
  <VermisStatusTag status="deprecated">Struck from the Canon</VermisStatusTag>
</Story>
