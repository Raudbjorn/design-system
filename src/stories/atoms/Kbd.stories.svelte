<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Kbd, Stack, Text } from '../../lib/index';

  const { Story } = defineMeta({
    title: 'Atoms/Kbd',
    component: Kbd,
    argTypes: {
      children: { table: { disable: true } }
    }
  });
</script>

<Story name="Single key" asChild>
  <Kbd>Esc</Kbd>
</Story>

<Story name="Chords" asChild>
  <Stack gap={3}>
    <Text>
      Quick-open is <Kbd>Ctrl</Kbd> + <Kbd>P</Kbd>, the palette is
      <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>P</Kbd>.
    </Text>
    <Text>
      Chorded: <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> then <Kbd>T</Kbd> to switch themes.
    </Text>
  </Stack>
</Story>
