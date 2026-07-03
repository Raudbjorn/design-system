import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(root, 'src/lib/fonts');
mkdirSync(outDir, { recursive: true });

// Inter: already woff2 — copy verbatim.
for (const f of ['InterVariable.woff2', 'InterVariable-Italic.woff2']) {
  copyFileSync(join(root, 'assets/fonts-src', f), join(outDir, f));
}

// Iosevka: subset TTF -> woff2. Keep Latin-1 + punctuation + digits + Nerd-Font PUA.
const unicodes = [
  'U+0000-00FF', // Latin-1
  'U+2000-206F', // general punctuation
  'U+2190-21FF', // arrows (common in code)
  'U+2500-259F', // box drawing (Nerd terminal)
  'U+E000-E00A,U+E0A0-E0A2,U+E0B0-E0B3', // powerline (scoped PUA)
  'U+F000-F2FF' // scoped Nerd-Font icon subset
].join(',');

const subset = (src, dest) =>
  execFileSync('pyftsubset', [
    join(root, src),
    `--unicodes=${unicodes}`,
    '--layout-features=*',
    '--no-hinting',
    '--desubroutinize',
    '--flavor=woff2',
    `--output-file=${dest}`
  ]);

subset('assets/fonts-src/IosevkaNerdFont-Regular.ttf', join(outDir, 'Iosevka-Regular.woff2'));
subset('assets/fonts-src/IosevkaNerdFont-Bold.ttf', join(outDir, 'Iosevka-Bold.woff2'));

for (const f of ['Iosevka-Regular.woff2', 'Iosevka-Bold.woff2']) {
  if (!existsSync(join(outDir, f))) throw new Error(`missing ${f}`);
}
console.log('fonts built');
