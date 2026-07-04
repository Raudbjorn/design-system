<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { StatCard, Stack } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Molecules/StatCard',
    component: StatCard,
    args: { value: '128', label: 'deploys this quarter', tone: 'accent' },
    argTypes: {
      tone: { control: 'inline-radio', options: ['accent', 'accent-2', 'default'] },
      value: { control: 'text' },
      label: { control: 'text' }
    },
    parameters: {
      docs: {
        description: {
          component:
            'The value is Iosevka with tabular numerals, so dashboards of these line up ' +
            'digit-for-digit. Coral (`accent-2`) is for the one number that needs attention.'
        }
      }
    }
  });
</script>

<Story name="Default" />

<Story name="Dashboard row" asChild>
  <Stack direction="row" gap={4} wrap>
    <StatCard value="99.98%" label="uptime, 30 days" />
    <StatCard value="212ms" label="p95 latency" tone="default" />
    <StatCard value="3" label="incidents open" tone="accent-2" />
  </Stack>
</Story>
