import { create } from 'storybook/theming';

// The manager chrome dressed in the system's own dark ramp — values mirror
// src/lib/tokens/palette.ts (dark). The manager can't consume --sv-* vars,
// so the hexes are repeated here verbatim.
export default create({
  base: 'dark',

  brandTitle: '@svnbjrn/design',
  brandUrl: 'https://sveinbjorn.dev',
  brandTarget: '_blank',

  colorPrimary: '#e06c75', // coral — one emphasis per view
  colorSecondary: '#4ec9b0', // teal — everything interactive

  appBg: '#191919',
  appContentBg: '#1e1e1e',
  appPreviewBg: '#191919',
  appBorderColor: '#3c3c3c',
  appBorderRadius: 6,

  fontBase: "'Inter', system-ui, sans-serif",
  fontCode: "'Iosevka', ui-monospace, 'Courier New', monospace",

  textColor: '#d4d4d4',
  textInverseColor: '#191919',
  textMutedColor: '#9a9a9a',

  barBg: '#1e1e1e',
  barTextColor: '#9a9a9a',
  barHoverColor: '#4ec9b0',
  barSelectedColor: '#4ec9b0',

  buttonBg: '#252526',
  buttonBorder: '#3c3c3c',
  booleanBg: '#252526',
  booleanSelectedBg: '#2d2d2d',

  inputBg: '#252526',
  inputBorder: '#3c3c3c',
  inputTextColor: '#d4d4d4',
  inputBorderRadius: 4
});
