<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterInput, CarterStack } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Atoms/Input',
    component: CarterInput,
    args: { label: 'Codename', type: 'text', invalid: false, disabled: false, readonly: false, required: false },
    argTypes: {
      type: { control: 'select', options: ['text', 'email', 'number', 'password', 'search', 'textarea'] },
      value: { control: 'text' },
      hint: { control: 'text' },
      invalid: { control: 'boolean' },
      disabled: { control: 'boolean' },
      readonly: { control: 'boolean' },
      required: { control: 'boolean' },
      children: { table: { disable: true } },
      oninput: { table: { disable: true } },
      onchange: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <CarterInput {...args} placeholder="MULDER, F." />
  {/snippet}
</Story>

<Story name="WithHint" asChild>
  <CarterInput label="Field agent ID" hint="As printed on the badge, no dashes" placeholder="X-42019" />
</Story>

<Story name="Invalid" asChild>
  <CarterInput
    label="Case number"
    value="04-B-??"
    invalid
    hint="Format must be NN-A-NNNN"
  />
</Story>

<Story name="Textarea" asChild>
  <CarterInput
    type="textarea"
    label="Field notes"
    placeholder="Subject exhibited no reflection under fluorescent light…"
  />
</Story>

<Story name="States" asChild>
  <CarterStack gap={4}>
    <CarterInput label="Codename" placeholder="MULDER, F." />
    <CarterInput label="Clearance level" disabled value="LEVEL 3 — REDACTED" />
    <CarterInput label="Case number" readonly value="04-B-1927" />
  </CarterStack>
</Story>

<Story name="Dossier theme" asChild>
  <div data-carter-theme="dossier" style="padding: 1rem; background: var(--carter-bg); color: var(--carter-text);">
    <CarterStack gap={4}>
      <CarterInput label="Codename" placeholder="MULDER, F." />
      <CarterInput label="Case number" invalid hint="Format must be NN-A-NNNN" value="04-B-??" />
    </CarterStack>
  </div>
</Story>
