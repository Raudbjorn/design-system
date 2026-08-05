// Vendoring installer contract (bin/qt-theme-install.sh) against fixture trees.
// Follows proxmox-install.test.mjs's real spawnSync + temporary-fixture
// convention; temporary roots are removed in afterEach.
//
// The installer is copy-only: helper + QSS + palette flat into an existing
// destination, optional WOFF2 fonts into <dest>/sv-fonts. Preflight before
// any write; syntax errors exit 2, preflight/filesystem errors exit 1.

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'bin/qt-theme-install.sh');
const HELPER = join(ROOT, 'bin/sv_design_qt.py');

const QSS_BODY = '/* fixture qss */\nQLabel[class="info"] { color: #6fa8c7; }\n';
const QSS_BODY_V2 = '/* fixture qss v2 */\nQLabel { color: #ffffff; }\n';
const PALETTE_BODY = `{
  "$generated": "by scripts/build-tokens.mjs — do not edit",
  "name": "dark"
}\n`;

let tmp;

const mkTmp = (name) => {
  if (!tmp) tmp = mkdtempSync(join(tmpdir(), 'sv-design-qtinstall-'));
  const dir = join(tmp, name);
  mkdirSync(dir, { recursive: true });
  return dir;
};

afterEach(() => {
  if (tmp) {
    rmSync(tmp, { recursive: true, force: true });
    tmp = null;
  }
});

const run = (script, ...args) =>
  spawnSync('bash', [script, ...args], { encoding: 'utf8', timeout: 30_000 });

const seedFlat = (root, theme, qss = QSS_BODY, palette = PALETTE_BODY) => {
  mkdirSync(join(root, 'qss'), { recursive: true });
  mkdirSync(join(root, 'qt'), { recursive: true });
  writeFileSync(join(root, 'qss', `${theme}.qss`), qss);
  writeFileSync(join(root, 'qt', `${theme}.palette.json`), palette);
};

const seedFonts = (root, names) => {
  mkdirSync(join(root, 'fonts'), { recursive: true });
  for (const name of names) writeFileSync(join(root, 'fonts', name), `font:${name}`);
};

const seedDest = (name = 'dest') => {
  const dest = mkTmp(name);
  writeFileSync(join(dest, 'keep.txt'), 'unrelated user file');
  return dest;
};

const read = (path) => readFileSync(path, 'utf8');

describe('flat --from success', () => {
  it('copies helper, QSS, and palette into an existing destination', () => {
    const root = mkTmp('flat');
    seedFlat(root, 'dark');
    const dest = seedDest();

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status, result.stderr).toBe(0);
    expect(read(join(dest, 'sv_design_qt.py'))).toBe(read(HELPER));
    expect(read(join(dest, 'dark.qss'))).toBe(QSS_BODY);
    expect(read(join(dest, 'dark.palette.json'))).toBe(PALETTE_BODY);
    expect(read(join(dest, 'keep.txt'))).toBe('unrelated user file');
  });
});

describe('--fonts behavior', () => {
  it('copies every fixture WOFF2 into dest/sv-fonts when requested', () => {
    const root = mkTmp('flat-fonts');
    seedFlat(root, 'dark');
    seedFonts(root, ['b-font.woff2', 'a-font.woff2', 'notes.txt']);
    const dest = seedDest('dest-fonts');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root, '--fonts');
    expect(result.status, result.stderr).toBe(0);
    expect(read(join(dest, 'sv-fonts/a-font.woff2'))).toBe('font:a-font.woff2');
    expect(read(join(dest, 'sv-fonts/b-font.woff2'))).toBe('font:b-font.woff2');
  });

  it('leaves no sv-fonts directory when --fonts is omitted', () => {
    const root = mkTmp('flat-nofonts');
    seedFlat(root, 'dark');
    seedFonts(root, ['a-font.woff2']);
    const dest = seedDest('dest-nofonts');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status, result.stderr).toBe(0);
    const listed = spawnSync('test', ['-e', join(dest, 'sv-fonts')]);
    expect(listed.status).not.toBe(0);
  });
});

describe('artifact root resolution', () => {
  it('resolves the package-root dist layout', () => {
    const root = mkTmp('pkg-dist');
    seedFlat(join(root, 'dist'), 'dark');
    const dest = seedDest('dest-dist');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status, result.stderr).toBe(0);
    expect(read(join(dest, 'dark.qss'))).toBe(QSS_BODY);
  });

  it('falls back to the source-root src/lib layout', () => {
    const root = mkTmp('pkg-src');
    seedFlat(join(root, 'src/lib'), 'dark');
    const dest = seedDest('dest-srclib');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status, result.stderr).toBe(0);
    expect(read(join(dest, 'dark.qss'))).toBe(QSS_BODY);
  });

  it('resolves a direct flat artifact root', () => {
    const root = mkTmp('pkg-flat');
    seedFlat(root, 'dark');
    const dest = seedDest('dest-flatroot');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status, result.stderr).toBe(0);
    expect(read(join(dest, 'dark.qss'))).toBe(QSS_BODY);
  });

  it('prefers dist over src/lib when both are complete', () => {
    const root = mkTmp('pkg-both');
    seedFlat(join(root, 'dist'), 'dark', '/* dist qss */\n');
    seedFlat(join(root, 'src/lib'), 'dark', '/* src qss */\n');
    const dest = seedDest('dest-precedence');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status, result.stderr).toBe(0);
    expect(read(join(dest, 'dark.qss'))).toBe('/* dist qss */\n');
  });

  it('never mixes candidates — a partial dist does not leak into src/lib', () => {
    const root = mkTmp('pkg-partial');
    // dist has the QSS but not the palette: incomplete, so skipped wholesale.
    mkdirSync(join(root, 'dist/qss'), { recursive: true });
    writeFileSync(join(root, 'dist/qss/dark.qss'), '/* dist qss */\n');
    seedFlat(join(root, 'src/lib'), 'dark', '/* src qss */\n');
    const dest = seedDest('dest-nomix');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status, result.stderr).toBe(0);
    expect(read(join(dest, 'dark.qss'))).toBe('/* src qss */\n');
    expect(read(join(dest, 'dark.palette.json'))).toBe(PALETTE_BODY);
  });
});

describe('filename stems', () => {
  for (const theme of ['dark', 'light', 'amber']) {
    it(`installs ${theme} with no theme- prefix`, () => {
      const root = mkTmp(`stems-${theme}`);
      seedFlat(root, theme, `/* ${theme} qss */\n`, `{ "name": "${theme}" }\n`);
      const dest = seedDest(`dest-stems-${theme}`);

      const result = run(SCRIPT, '--theme', theme, '--dest', dest, '--from', root);
      expect(result.status, result.stderr).toBe(0);
      expect(read(join(dest, `${theme}.qss`))).toBe(`/* ${theme} qss */\n`);
      expect(read(join(dest, `${theme}.palette.json`))).toBe(`{ "name": "${theme}" }\n`);
      const ls = spawnSync('ls', [dest], { encoding: 'utf8' }).stdout;
      expect(ls).not.toContain('theme-');
    });
  }
});

describe('idempotent overwrite', () => {
  it('re-installation after source bytes change is exit 0 and byte-stable', () => {
    const root = mkTmp('idem');
    seedFlat(root, 'dark');
    const dest = seedDest('dest-idem');

    const first = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(first.status, first.stderr).toBe(0);

    writeFileSync(join(root, 'qss/dark.qss'), QSS_BODY_V2);
    const second = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(second.status, second.stderr).toBe(0);
    expect(read(join(dest, 'dark.qss'))).toBe(QSS_BODY_V2);
    expect(read(join(dest, 'dark.palette.json'))).toBe(PALETTE_BODY);
    expect(read(join(dest, 'sv_design_qt.py'))).toBe(read(HELPER));
  });

  it('same-file copies are a no-op when the artifact root is the destination', () => {
    const root = mkTmp('selfroot');
    seedFlat(root, 'dark');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', root, '--from', root);
    expect(result.status, result.stderr).toBe(0);
    expect(read(join(root, 'qss/dark.qss'))).toBe(QSS_BODY);
    expect(read(join(root, 'qt/dark.palette.json'))).toBe(PALETTE_BODY);
    expect(read(join(root, 'dark.qss'))).toBe(QSS_BODY);
  });
});

describe('argument handling', () => {
  it('--help exits 0', () => {
    const result = run(SCRIPT, '--help');
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toContain('Usage');
  });

  const syntaxErrors = [
    ['missing --theme', ['--dest', '/tmp']],
    ['missing --dest', ['--theme', 'dark']],
    ['missing --dest value', ['--theme', 'dark', '--dest']],
    ['missing --theme value', ['--theme']],
    ['unknown flag', ['--theme', 'dark', '--dest', '/tmp', '--bogus']],
    ['duplicate --theme', ['--theme', 'dark', '--theme', 'dark', '--dest', '/tmp']],
    ['duplicate --dest', ['--theme', 'dark', '--dest', '/tmp', '--dest', '/tmp']],
    ['duplicate --fonts', ['--theme', 'dark', '--dest', '/tmp', '--fonts', '--fonts']],
    ['uppercase theme name', ['--theme', 'Dark', '--dest', '/tmp']],
    ['path-traversal theme name', ['--theme', '../evil', '--dest', '/tmp']],
    ['theme name with slash', ['--theme', 'dark/light', '--dest', '/tmp']]
  ];

  for (const [label, args] of syntaxErrors) {
    it(`exits 2: ${label}`, () => {
      const result = run(SCRIPT, ...args);
      expect(result.status, result.stdout + result.stderr).toBe(2);
    });
  }
});

describe('preflight failures leave the destination untouched', () => {
  it('exits 1 for a theme missing from a complete layout', () => {
    const root = mkTmp('miss-theme');
    seedFlat(root, 'dark');
    const dest = seedDest('dest-miss-theme');

    const result = run(SCRIPT, '--theme', 'amber', '--dest', dest, '--from', root);
    expect(result.status).toBe(1);
    expect(result.stderr).not.toBe('');
    expect(read(join(dest, 'keep.txt'))).toBe('unrelated user file');
    const ls = spawnSync('ls', [dest], { encoding: 'utf8' }).stdout;
    expect(ls).toContain('keep.txt');
    expect(ls.split('\n').filter(Boolean)).toHaveLength(1);
  });

  it('exits 1 before any copy when a file squats on the sv-fonts path', () => {
    const root = mkTmp('font-squat');
    seedFlat(root, 'dark');
    seedFonts(root, ['Iosevka-Regular.woff2']);
    const dest = seedDest('dest-font-squat');
    writeFileSync(join(dest, 'sv-fonts'), 'not a directory');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root, '--fonts');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('sv-fonts');
    // Nothing was installed: only the user's file and the blocking path remain.
    expect(read(join(dest, 'keep.txt'))).toBe('unrelated user file');
    expect(read(join(dest, 'sv-fonts'))).toBe('not a directory');
    const ls = spawnSync('ls', [dest], { encoding: 'utf8' }).stdout;
    expect(ls.split('\n').filter(Boolean).sort()).toEqual(['keep.txt', 'sv-fonts']);
  });

  it('exits 1 for an incomplete layout (QSS without palette)', () => {
    const root = mkTmp('incomplete');
    mkdirSync(join(root, 'qss'), { recursive: true });
    writeFileSync(join(root, 'qss/dark.qss'), QSS_BODY);
    const dest = seedDest('dest-incomplete');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status).toBe(1);
    expect(read(join(dest, 'keep.txt'))).toBe('unrelated user file');
    const ls = spawnSync('ls', [dest], { encoding: 'utf8' }).stdout;
    expect(ls.split('\n').filter(Boolean)).toHaveLength(1);
  });

  it('exits 1 when the destination does not exist', () => {
    const root = mkTmp('miss-dest-root');
    seedFlat(root, 'dark');
    const dest = join(mkTmp('miss-dest-parent'), 'nope');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status).toBe(1);
    const exists = spawnSync('test', ['-e', dest]);
    expect(exists.status).not.toBe(0);
  });

  it('exits 1 when fonts are requested but none match', () => {
    const root = mkTmp('empty-fonts');
    seedFlat(root, 'dark');
    mkdirSync(join(root, 'fonts'), { recursive: true });
    writeFileSync(join(root, 'fonts/readme.txt'), 'no fonts here');
    const dest = seedDest('dest-empty-fonts');

    const result = run(SCRIPT, '--theme', 'dark', '--dest', dest, '--from', root, '--fonts');
    expect(result.status).toBe(1);
    expect(read(join(dest, 'keep.txt'))).toBe('unrelated user file');
    const ls = spawnSync('ls', [dest], { encoding: 'utf8' }).stdout;
    expect(ls.split('\n').filter(Boolean)).toHaveLength(1);
  });

  it('exits 1 when the helper is missing beside a copied installer', () => {
    const binDir = mkTmp('orphan/bin');
    const orphanInstaller = join(binDir, 'qt-theme-install.sh');
    writeFileSync(orphanInstaller, readFileSync(SCRIPT, 'utf8'));
    const root = mkTmp('orphan-root');
    seedFlat(root, 'dark');
    const dest = seedDest('dest-orphan');

    const result = run(orphanInstaller, '--theme', 'dark', '--dest', dest, '--from', root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('sv_design_qt.py');
    expect(read(join(dest, 'keep.txt'))).toBe('unrelated user file');
    const ls = spawnSync('ls', [dest], { encoding: 'utf8' }).stdout;
    expect(ls.split('\n').filter(Boolean)).toHaveLength(1);
  });
});
