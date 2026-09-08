<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterClearanceBadge, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/ClearanceBadge',
    component: CarterClearanceBadge,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Primary" asChild>
  <CarterClearanceBadge tone="primary">Level 3 clearance</CarterClearanceBadge>
</Story>

<Story name="Tones" asChild>
  <CarterStack direction="row" gap={3} align="center" wrap>
    <CarterClearanceBadge tone="primary">Level 3</CarterClearanceBadge>
    <CarterClearanceBadge tone="danger">Compromised</CarterClearanceBadge>
    <CarterClearanceBadge tone="warning">Pending review</CarterClearanceBadge>
    <CarterClearanceBadge tone="muted">Revoked</CarterClearanceBadge>
  </CarterStack>
</Story>
