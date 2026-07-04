import type { StorybookConfig } from '@storybook/svelte-vite';

const config: StorybookConfig = {
  framework: '@storybook/svelte-vite',
  stories: ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.svelte'],
  addons: [
    '@storybook/addon-svelte-csf',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes'
  ],
  // Serve the self-hosted fonts so manager-head.html can @font-face them —
  // the preview gets them for free through the tokens CSS import.
  staticDirs: [{ from: '../src/lib/fonts', to: '/fonts' }]
};

export default config;
