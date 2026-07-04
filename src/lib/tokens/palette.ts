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

// Light theme mirror — soft pale-yellow "paper". The bg is held below full
// brightness and the ramp warmed toward its hue so it reads as ink-on-paper,
// not glare-white. Ink is eased off pure black (strong ~12:1, was 16:1) and the
// syntax palette is desaturated + warmed so the code panel isn't a stab of
// primary blue/red. All body text + accents verified AA in palette.test.ts.
export const light: Palette = {
  bg: '#f1e7c4',
  'surface-1': '#ece1b8',
  'surface-2': '#e6dcb2',
  'surface-3': '#e0d5a8',
  border: '#c7ba85',
  text: '#3a3527',
  'text-strong': '#2a2617',
  'text-muted': '#605b47',
  'text-faint': '#65604b', // AA (>=4.5:1) on the #f1e7c4 paper
  accent: '#2b8a77',
  'accent-2': '#c0505a',
  'accent-rust': '#b26a45',
  'mix-target': '#000000', // hover darkens in light
  success: '#0c9138',
  error: '#d13b2a',
  warning: '#b26a00',
  'syn-keyword': '#274a86',
  'syn-string': '#8a4326',
  'syn-var': '#2f3f6e',
  'syn-func': '#6a531f',
  'syn-comment': '#5a6a3d',
  'syn-number': '#2f5f45'
};
