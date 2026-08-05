// Token build: DTCG sources (*.tokens.json + themes.ts) → committed outputs.
//   src/lib/tokens/scale.css              @layer sv.base
//   src/lib/tokens/colors.css             @layer sv.theme, every registry theme
//   src/lib/tokens/palette.ts             generated TS view (compat exports)
//   src/lib/tokens/resolved/<name>.tokens.json   flat map for non-JS consumers
//   src/lib/qss/<name>.qss                Qt Style Sheet for PySide6
//   src/lib/qt/<name>.palette.json        QPalette role map for PySide6/Qt
//   src/lib/extjs/theme-sv-<name>.css     ExtJS override sheet for Proxmox
//   crates/raudbjorn-tui/src/theme/generated.rs   ratatui::Color constants for raudbjorn-tui
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
import { emitExtJs } from './emitters/emit-extjs.mjs';
import { emitQt } from './emitters/emit-qt.mjs';
import { emitTuiRust } from './emitters/emit-tui-rust.mjs';

const prepared = prepareBuild();
if (!prepared.ok) {
  for (const error of prepared.error) console.error(`[tokens] ${error}`);
  process.exit(1);
}
const { base, themes } = prepared.value;

const QSS_DIR = join(TOKENS_DIR, '../qss');
const EXTJS_DIR = join(TOKENS_DIR, '../extjs');
const QT_DIR = join(TOKENS_DIR, '../qt');
const RESOLVED_DIR = join(TOKENS_DIR, 'resolved');
mkdirSync(QSS_DIR, { recursive: true });
mkdirSync(EXTJS_DIR, { recursive: true });
mkdirSync(QT_DIR, { recursive: true });
mkdirSync(join(TOKENS_DIR, '../../../crates/raudbjorn-tui/src/theme'), { recursive: true });
mkdirSync(RESOLVED_DIR, { recursive: true });

const qtOutputs = [];
let qtFailed = false;
for (const theme of themes) {
  const result = emitQt(theme);
  if (!result.ok) {
    qtFailed = true;
    for (const issue of result.error) {
      console.error(`[tokens] Qt theme "${theme.name}": ${issue.message}`);
    }
    continue;
  }
  qtOutputs.push([join(QT_DIR, `${theme.name}.palette.json`), result.value]);
}
if (qtFailed) process.exit(1);

const outputs = [
  [join(TOKENS_DIR, 'scale.css'), emitScaleCss(base)],
  [join(TOKENS_DIR, 'colors.css'), emitColorsCss(themes)],
  [join(TOKENS_DIR, 'palette.ts'), emitPaletteTs(themes)],
  ...themes.map((t) => [join(RESOLVED_DIR, `${t.name}.tokens.json`), emitResolvedJson(t)]),
  ...themes.map((t) => [join(QSS_DIR, `${t.name}.qss`), emitQss(t)]),
  ...themes.map((t) => [join(EXTJS_DIR, `theme-sv-${t.name}.css`), emitExtJs(t)]),
  ...qtOutputs,
  [join(TOKENS_DIR, `../../../crates/raudbjorn-tui/src/theme/generated.rs`), emitTuiRust(themes)]
];

for (const [path, content] of outputs) {
  writeFileSync(path, content);
  console.log('wrote', path);
}
