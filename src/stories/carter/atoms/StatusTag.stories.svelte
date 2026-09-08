<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterStatusTag, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/StatusTag',
    component: CarterStatusTag,
    args: { status: 'open' },
    argTypes: {
      status: { control: 'select', options: ['open', 'cold', 'burned', 'active', 'closed'] }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" args={{ status: 'open' }} />

<Story name="All statuses" asChild>
  <CarterStack direction="row" gap={3} align="center" wrap>
    <CarterStatusTag status="open" />
    <CarterStatusTag status="active" />
    <CarterStatusTag status="cold" />
    <CarterStatusTag status="burned" />
    <CarterStatusTag status="closed" />
  </CarterStack>
</Story>
