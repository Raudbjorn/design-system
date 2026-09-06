<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterHeading, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/Heading',
    component: CarterHeading,
    argTypes: {
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" asChild>
  <CarterHeading level={2}>Case File 88-114</CarterHeading>
</Story>

<Story name="Level ramp" asChild>
  <CarterStack direction="column" gap={2}>
    <CarterHeading level={1}>Delta Green: Case File 88-114</CarterHeading>
    <CarterHeading level={2}>Incident Summary</CarterHeading>
    <CarterHeading level={3}>Witness Statements</CarterHeading>
    <CarterHeading level={4}>Blackwood Grain Silo, Sub-Level 2</CarterHeading>
  </CarterStack>
</Story>

<Story name="With kicker" asChild>
  <CarterHeading level={2} kicker="Restricted // Need to Know">Anomalous Signal Recovery</CarterHeading>
</Story>
