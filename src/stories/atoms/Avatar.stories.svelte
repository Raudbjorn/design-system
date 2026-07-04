<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Avatar, Stack } from '../../lib/index';

  // Self-contained placeholder portrait — a teal-to-coral gradient, no network.
  const portrait =
    'data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#4ec9b0"/><stop offset="1" stop-color="#e06c75"/>
        </linearGradient></defs>
        <rect width="64" height="64" fill="url(#g)"/>
        <circle cx="32" cy="26" r="11" fill="#191919" opacity="0.85"/>
        <ellipse cx="32" cy="52" rx="18" ry="12" fill="#191919" opacity="0.85"/>
      </svg>`
    );

  const { Story } = defineMeta({
    title: 'Atoms/Avatar',
    component: Avatar,
    args: { alt: 'Sveinbjörn Geirsson', size: 'md' },
    argTypes: {
      size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
      src: { control: 'text' },
      alt: { control: 'text' }
    },
    parameters: {
      docs: {
        description: {
          component:
            'Without `src`, initials are derived from `alt` (first two words). ' +
            '`alt` is required either way — the fallback is a labelled `role="img"`.'
        }
      }
    }
  });
</script>

<Story name="Initials" />

<Story name="With image" args={{ src: portrait }} />

<Story name="Sizes" asChild>
  <Stack direction="row" gap={4} align="center">
    <Avatar alt="Sveinbjörn Geirsson" size="sm" />
    <Avatar alt="Sveinbjörn Geirsson" size="md" />
    <Avatar alt="Sveinbjörn Geirsson" size="lg" />
  </Stack>
</Story>
