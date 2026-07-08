<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Progress } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Progress',
    component: Progress,
    args: { value: 60, label: 'Syncing', tone: 'accent' },
    argTypes: {
      value: { control: 'range', min: 0, max: 100 }
    }
  });
</script>

<Story name="Determinate">
  {#snippet template(args)}
    <Progress {...args} />
  {/snippet}
</Story>

<Story name="Indeterminate" asChild>
  <Progress indeterminate label="Compiling SYCL kernels" />
</Story>
