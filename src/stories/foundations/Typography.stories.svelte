<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';

  const { Story } = defineMeta({
    title: 'Foundations/Typography',
    parameters: {
      controls: { disable: true },
      docs: {
        description: {
          component:
            'Two faces, both self-hosted and subset: **Inter** carries the UI, **Iosevka** carries ' +
            'code — and code is a first-class citizen here, not an afterthought. The weight ramp is ' +
            'tuned for Inter Variable: `bold` is **650**, deliberately lighter than the CSS keyword 700.'
        }
      }
    }
  });
</script>

<script lang="ts">
  import { Heading, Kbd, Stack, Text } from '../../lib/index';
  import Eyebrow from './Eyebrow.svelte';
  import SpecRow from './SpecRow.svelte';

  const headingRamp = [
    { token: '--sv-fs-3xl / h1', level: 1, sample: 'Sveinbjörn' },
    { token: '--sv-fs-2xl / h2', level: 2, sample: 'Þingvellir' },
    { token: '--sv-fs-xl / h3', level: 3, sample: 'Reykjavík' },
    { token: '--sv-fs-lg / h4', level: 4, sample: 'Ísafjörður' }
  ] as const;

  const textSizes = ['xs', 'sm', 'base', 'lg'] as const;
  const tones = ['default', 'strong', 'muted', 'faint'] as const;

  const weights = [
    { token: '--sv-font-weight-normal', value: 400, note: 'body copy' },
    { token: '--sv-font-weight-medium', value: 550, note: 'buttons and labels' },
    { token: '--sv-font-weight-semibold', value: 600, note: 'avatar initials, emphasis' },
    { token: '--sv-font-weight-bold', value: 650, note: 'headings — 650, not the keyword 700' }
  ];

  // Icelandic pangram — every accented glyph the Inter subset must keep.
  const pangram = 'Kæmi ný öxi hér, ykist þjófum nú bæði víl og ádrepa.';

  // Nerd-Font PUA glyph (U+F120 terminal) the Iosevka subset keeps.
  const monoSample = '\uf120 git push origin main --force-with-lease';
</script>

<Story name="Specimen" asChild>
  <Stack gap={12}>
    <section>
      <Eyebrow>--sv-fs-* · heading ramp</Eyebrow>
      <Stack gap={4}>
        {#each headingRamp as row (row.level)}
          <SpecRow label={row.token}>
            <Heading level={row.level}>{row.sample}</Heading>
          </SpecRow>
        {/each}
      </Stack>
    </section>

    <section>
      <Eyebrow>text sizes · Inter</Eyebrow>
      <Stack gap={3}>
        {#each textSizes as size (size)}
          <SpecRow label={size}>
            <Text {size}>{pangram}</Text>
          </SpecRow>
        {/each}
      </Stack>
    </section>

    <section>
      <Eyebrow>tones</Eyebrow>
      <Stack gap={3}>
        {#each tones as tone (tone)}
          <SpecRow label={tone}>
            <Text {tone}>The quieter the tone, the further from the reader it sits.</Text>
          </SpecRow>
        {/each}
      </Stack>
    </section>

    <section>
      <Eyebrow>weight ramp · roles, not CSS keywords</Eyebrow>
      <Stack gap={3}>
        {#each weights as w (w.value)}
          <SpecRow label={w.token}>
            <span class="weight-sample" style:font-weight={w.value}>{w.value} · {w.note}</span>
          </SpecRow>
        {/each}
      </Stack>
    </section>

    <section>
      <Eyebrow>mono · Iosevka, with Nerd-Font glyphs</Eyebrow>
      <Stack gap={3}>
        <Text mono>{monoSample}</Text>
        <Text mono size="sm" tone="muted"
          >0123456789 · oO0 iIlL1 · tabular numerals in StatCard</Text
        >
        <div>
          <Kbd>Ctrl</Kbd><span class="plus">+</span><Kbd>K</Kbd>
          <span class="plus">then</span>
          <Kbd>T</Kbd>
        </div>
      </Stack>
    </section>
  </Stack>
</Story>

<style>
  .weight-sample {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-base);
    color: var(--sv-text);
  }
  .plus {
    font-family: var(--sv-font-sans);
    font-size: var(--sv-fs-xs);
    color: var(--sv-text-faint);
    margin-inline: var(--sv-space-1);
  }
</style>
