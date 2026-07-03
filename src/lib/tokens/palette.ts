export type Palette = Record<string, string>;

// Dark theme (default). Values hand-verified for WCAG AA where noted.
export const dark: Palette = {
  bg: '#191919',
  'surface-1': '#1e1e1e',
  'surface-2': '#252526',
  'surface-3': '#2d2d2d',
  border: '#3c3c3c',
  text: '#d4d4d4',
  'text-strong': '#f5f5f5',
  'text-muted': '#9a9a9a',
  'text-faint': '#818181', // AA (>=4.5:1) on #191919; review's #767676 only cleared black
  accent: '#4ec9b0',
  'accent-2': '#e06c75',
  'accent-rust': '#ce9178',
  'mix-target': '#ffffff', // hover lightens in dark
  success: '#0c9138',
  error: '#f44430',
  warning: '#ffa500',
  'syn-keyword': '#569cd6',
  'syn-string': '#ce9178',
  'syn-var': '#9cdcfe',
  'syn-func': '#dcdcaa',
  'syn-comment': '#6a9955',
  'syn-number': '#b5cea8'
};

// Light theme mirror. Accents darkened to clear AA on white.
export const light: Palette = {
  bg: '#ffffff',
  'surface-1': '#f5f5f5',
  'surface-2': '#ececec',
  'surface-3': '#e4e4e4',
  border: '#d4d4d4',
  text: '#333333',
  'text-strong': '#191919',
  'text-muted': '#6a6a6a',
  'text-faint': '#767676', // AA on #ffffff
  accent: '#2b8a77',
  'accent-2': '#c0505a',
  'accent-rust': '#b26a45',
  'mix-target': '#000000', // hover darkens in light
  success: '#0c9138',
  error: '#d13b2a',
  warning: '#b26a00',
  'syn-keyword': '#0000ff',
  'syn-string': '#a31515',
  'syn-var': '#001080',
  'syn-func': '#795e26',
  'syn-comment': '#008000',
  'syn-number': '#098658'
};
