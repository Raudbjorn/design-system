import { create } from 'storybook/theming';
import { dark } from '../src/lib/tokens/palette';

// The manager chrome dressed in the system's own dark ramp, read straight
// from the token source (palette.ts) so the Storybook UI can't drift from
// the design tokens. The manager can't consume --sv-* custom properties,
// so this maps palette keys onto Storybook's theme API instead.
const sv = (token: string): string => {
  const hex = dark[token];
  if (!hex) throw new Error(`.storybook/theme.ts: unknown palette token '${token}'`);
  return hex;
};

export default create({
  base: 'dark',

  brandTitle: '@svnbjrn/design',
  brandUrl: 'https://sveinbjorn.dev',
  brandTarget: '_blank',

  colorPrimary: sv('accent-2'), // coral — one emphasis per view
  colorSecondary: sv('accent'), // teal — everything interactive

  appBg: sv('bg'),
  appContentBg: sv('surface-1'),
  appPreviewBg: sv('bg'),
  appBorderColor: sv('border'),
  appBorderRadius: 6,

  fontBase: "'Inter', system-ui, sans-serif",
  fontCode: "'Iosevka', ui-monospace, 'Courier New', monospace",

  textColor: sv('text'),
  textInverseColor: sv('bg'),
  textMutedColor: sv('text-muted'),

  barBg: sv('surface-1'),
  barTextColor: sv('text-muted'),
  barHoverColor: sv('accent'),
  barSelectedColor: sv('accent'),

  buttonBg: sv('surface-2'),
  buttonBorder: sv('border'),
  booleanBg: sv('surface-2'),
  booleanSelectedBg: sv('surface-3'),

  inputBg: sv('surface-2'),
  inputBorder: sv('border'),
  inputTextColor: sv('text'),
  inputBorderRadius: 4
});
