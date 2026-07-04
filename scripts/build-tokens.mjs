// Token build: DTCG sources (*.tokens.json + themes.ts) → committed outputs.
//   src/lib/tokens/scale.css              @layer sv.base
//   src/lib/tokens/colors.css             @layer sv.theme, every registry theme
//   src/lib/tokens/palette.ts             generated TS view (compat exports)
//   src/lib/tokens/resolved/<name>.tokens.json   flat map for non-JS consumers
//   src/lib/qss/<name>.qss                Qt Style Sheet for PySide6
//
// Layer order (declared in index.css): sv.base < sv.theme < sv.world < sv.user.
// Run via `pnpm run tokens`. Fails with a non-zero exit on any token error —
// every error is printed, not just the first.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { prepareBuild, TOKENS_DIR } from './emitters/prepare.mjs';
import { emitColorsCss, emitScaleCss } from './emitters/emit-css.mjs';
import { emitPaletteTs } from './emitters/emit-palette-ts.mjs';
import { emitResolvedJson } from './emitters/emit-json.mjs';
import { emitQss } from './emitters/emit-qss.mjs';

const prepared = prepareBuild();
if (!prepared.ok) {
  for (const error of prepared.error) console.error(`[tokens] ${error}`);
  process.exit(1);
}
const { base, themes } = prepared.value;

const QSS_DIR = join(TOKENS_DIR, '../qss');
const RESOLVED_DIR = join(TOKENS_DIR, 'resolved');
mkdirSync(QSS_DIR, { recursive: true });
mkdirSync(RESOLVED_DIR, { recursive: true });

const outputs = [
  [join(TOKENS_DIR, 'scale.css'), emitScaleCss(base)],
  [join(TOKENS_DIR, 'colors.css'), emitColorsCss(themes)],
  [join(TOKENS_DIR, 'palette.ts'), emitPaletteTs(themes)],
  ...themes.map((t) => [join(RESOLVED_DIR, `${t.name}.tokens.json`), emitResolvedJson(t)]),
  ...themes.map((t) => [join(QSS_DIR, `${t.name}.qss`), emitQss(t)])
];

for (const [path, content] of outputs) {
  writeFileSync(path, content);
  console.log('wrote', path);
}
