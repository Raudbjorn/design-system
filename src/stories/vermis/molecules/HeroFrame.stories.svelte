<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { VermisHeroFrame } from '../../../lib/vermis';
  import '../../../lib/vermis/tokens/index.css';
  import { argosSingleMode } from '../../shared/argosSingleMode';

  const { Story } = defineMeta({
    title: 'Vermis/Molecules/HeroFrame',
    component: VermisHeroFrame,
    argTypes: {
      children: { table: { disable: true } },
      caption: { table: { disable: true } }
    },
    parameters: {
      ...argosSingleMode,
      docs: {
        description: {
          component:
            'Full-bleed hero art with a fire-once scroll reveal, gated on ' +
            'IntersectionObserver. Renders instantly, with no transition, under ' +
            '`prefers-reduced-motion: reduce` — Storybook\'s own canvas keeps the frame ' +
            'in view from first paint, so these stories settle into their resting state ' +
            'immediately rather than showing the pre-reveal offset.'
        }
      }
    }
  });
</script>

<!-- `children` is required and not a meaningful Controls target — every
     story here goes straight to `asChild`, same as core's NavBar.stories.svelte. -->

<Story name="Illustration" asChild>
  <VermisHeroFrame kind="illustration">
    <svg
      viewBox="0 0 800 300"
      role="img"
      aria-label="Engraving of a threshold arch"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="800" height="300" fill="#e7ddc7" />
      <path d="M100 300 V150 Q400 20 700 150 V300" fill="none" stroke="#3a2f26" stroke-width="4" />
      <circle cx="400" cy="120" r="26" fill="#3a2f26" opacity="0.8" />
    </svg>
  </VermisHeroFrame>
</Story>

<Story name="Photo" asChild>
  <VermisHeroFrame kind="photo">
    <svg
      viewBox="0 0 800 300"
      role="img"
      aria-label="Engraving of a threshold arch"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="800" height="300" fill="#e7ddc7" />
      <path d="M100 300 V150 Q400 20 700 150 V300" fill="none" stroke="#3a2f26" stroke-width="4" />
      <circle cx="400" cy="120" r="26" fill="#3a2f26" opacity="0.8" />
    </svg>
  </VermisHeroFrame>
</Story>

<Story name="With caption" asChild>
  <VermisHeroFrame kind="illustration">
    <svg
      viewBox="0 0 800 300"
      role="img"
      aria-label="Engraving of a threshold arch"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="800" height="300" fill="#e7ddc7" />
      <path d="M100 300 V150 Q400 20 700 150 V300" fill="none" stroke="#3a2f26" stroke-width="4" />
      <circle cx="400" cy="120" r="26" fill="#3a2f26" opacity="0.8" />
    </svg>
    {#snippet caption()}Frontispiece — the threshold arch, artist unrecorded{/snippet}
  </VermisHeroFrame>
</Story>
