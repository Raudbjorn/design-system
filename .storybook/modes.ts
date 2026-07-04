// Storybook globals presets that Argos captures as separate, named baselines.
// The `theme` global drives the withThemeByDataAttribute decorator in preview.ts.
export const allModes = {
  dark: { theme: 'dark' },
  light: { theme: 'light' }
} as const;
