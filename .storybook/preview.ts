import type { Preview } from '@storybook/svelte-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import theme from './theme';
import '../src/lib/tokens/index.css';
import './preview.css';

const preview: Preview = {
  decorators: [
    // Theme switching goes through the library's real contract: data-theme on
    // the root element, exactly as a consumer would set it. No backgrounds addon.
    withThemeByDataAttribute({
      themes: { dark: 'dark', light: 'light' },
      defaultTheme: 'dark',
      attributeName: 'data-theme',
      parentSelector: 'html'
    })
  ],
  parameters: {
    docs: { theme },
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    options: {
      storySort: {
        order: [
          'Foundations',
          ['Overview', 'Colors', 'Typography', 'Spacing & Radius'],
          'Atoms',
          'Layout',
          'Molecules'
        ]
      }
    }
  },
  tags: ['autodocs']
};

export default preview;
