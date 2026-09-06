<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterTimestamp, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/Timestamp',
    component: CarterTimestamp,
    args: { value: '1927-07-17T02:14:00' },
    argTypes: {
      value: { control: 'text' },
      prefix: { control: 'text' }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default" />

<Story name="WithPrefix" args={{ prefix: 'Logged:' }} />

<Story name="Invalid" args={{ value: 'not-a-date' }} />

<Story name="Multiple stamps" asChild>
  <CarterStack gap={2}>
    <CarterTimestamp prefix="Logged:" value="1927-07-17T02:14:00" />
    <CarterTimestamp prefix="Last seen:" value="1927-07-19T23:51:00" />
    <CarterTimestamp prefix="Sealed:" value="1927-08-02T09:00:00" />
  </CarterStack>
</Story>

<Story name="Dossier theme" asChild>
  <div data-carter-theme="dossier" style="padding: 1rem; background: var(--carter-bg); color: var(--carter-text);">
    <CarterStack gap={2}>
      <CarterTimestamp prefix="Logged:" value="1927-07-17T02:14:00" />
      <CarterTimestamp value="1927-07-19T23:51:00" />
    </CarterStack>
  </div>
</Story>
