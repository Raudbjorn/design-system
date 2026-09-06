<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { CarterFormField } from '../../../lib/carter';
  import '../../../lib/carter/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Carter/Molecules/FormField',
    component: CarterFormField,
    args: { label: 'Codename', required: false },
    argTypes: {
      label: { control: 'text' },
      hint: { control: 'text' },
      error: { control: 'text' },
      required: { control: 'boolean' },
      id: { table: { disable: true } },
      children: { table: { disable: true } }
    },
    parameters: argosSingleMode
  });
</script>

<!-- `id` has no auto-generation (see the component's docs) so every story
     supplies a stable, story-unique id and wires the control's
     aria-describedby to match, per the field's own contract. -->

<Story name="Default" args={{ id: 'codename', label: 'Codename', required: true }}>
  {#snippet template({ children: _, ...args })}
    <CarterFormField {...args}>
      <input id={args.id} type="text" placeholder="e.g. NIGHTHAWK" required={args.required} />
    </CarterFormField>
  {/snippet}
</Story>

<Story
  name="With hint"
  args={{ id: 'incident-date', label: 'Incident date', hint: 'Use the date of first contact, not the report date.' }}
>
  {#snippet template({ children: _, ...args })}
    <CarterFormField {...args}>
      <input id={args.id} type="text" aria-describedby={`${args.id}-hint`} />
    </CarterFormField>
  {/snippet}
</Story>

<Story
  name="With error"
  args={{
    id: 'witness-count',
    label: 'Witness count',
    error: 'Enter a number of 0 or greater.',
    required: true
  }}
>
  {#snippet template({ children: _, ...args })}
    <CarterFormField {...args}>
      <input
        id={args.id}
        type="number"
        min="0"
        aria-describedby={`${args.id}-error`}
        aria-invalid="true"
      />
    </CarterFormField>
  {/snippet}
</Story>

<Story
  name="Textarea"
  args={{ id: 'summary', label: 'Summary', hint: 'Two sentences maximum.' }}
>
  {#snippet template({ children: _, ...args })}
    <CarterFormField {...args}>
      <textarea id={args.id} aria-describedby={`${args.id}-hint`} rows="3"></textarea>
    </CarterFormField>
  {/snippet}
</Story>
