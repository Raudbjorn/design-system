// Installer lifecycle against a fixture tree (SV_PREFIX), not a live node.
//
// These exist because the installer's first two bugs both lived in the
// *unexercised branch of an exercised path*: a same-file install(1) that
// aborted the APT hook, and a `grep | wc -l` that killed `uninstall
// --purge-fonts` under `set -euo pipefail` whenever it was the last theme —
// the branch the flag exists for. Manual spot-checks kept taking the other
// branch, so the branches are enumerated here instead.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

const SCRIPT = join(process.cwd(), 'bin/proxmox-theme-install.sh');
const SHEET = join(process.cwd(), 'src/lib/extjs/theme-sv-dark.css');
const SHEET_LIGHT = join(process.cwd(), 'src/lib/extjs/theme-sv-light.css');

const PRISTINE_LIB = `Ext.define('Proxmox.Utils', {
    theme_map: {
\tcrisp: 'Light theme',
\t'proxmox-dark': 'Proxmox Dark',
    },
    theme_array: function() { return Object.keys(this.theme_map); },
});
`;

const FONT_NAMES = [
  'InterVariable.woff2',
  'InterVariable-Italic.woff2',
  'Iosevka-Regular.woff2',
  'Iosevka-Bold.woff2'
];

let root;
let fontsSrc;

const p = (...segments) => join(root, ...segments);
const THEMES = 'usr/share/javascript/proxmox-widget-toolkit/themes';
const LIB = 'usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js';
const HOOK = 'etc/apt/apt.conf.d/99-svnbjrn-design-theme';

const write = (path, contents) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
};

const run = (...args) =>
  spawnSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, SV_PREFIX: root }
  });

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'sv-pve-'));
  fontsSrc = join(root, 'fonts-src');
  mkdirSync(p(THEMES), { recursive: true });
  mkdirSync(p('etc/apt/apt.conf.d'), { recursive: true });
  mkdirSync(p('usr/share/pve-manager'), { recursive: true });
  mkdirSync(fontsSrc, { recursive: true });
  write(p(LIB), PRISTINE_LIB);
  for (const font of FONT_NAMES) writeFileSync(join(fontsSrc, font), 'stub');
});

describe('proxmox-theme-install.sh', () => {
  it('installs, registers, and reports status', () => {
    expect(run('install', SHEET, '--fonts', fontsSrc, '--register').status).toBe(0);
    expect(existsSync(p(THEMES, 'theme-sv-dark.css'))).toBe(true);
    expect(readFileSync(p(LIB), 'utf8')).toContain('svnbjrn-design:sv-dark');
    expect(run('status').stdout).toContain('sv-dark (registered)');
  });

  it('is idempotent and never registers twice', () => {
    run('install', SHEET, '--fonts', fontsSrc, '--register');
    expect(run('install', SHEET, '--fonts', fontsSrc, '--register').status).toBe(0);
    const lib = readFileSync(p(LIB), 'utf8');
    expect(lib.match(/svnbjrn-design:sv-dark/g)).toHaveLength(1);
  });

  it('purges fonts when removing the last theme, and cleans up after itself', () => {
    // The regression: grep found nothing, pipefail propagated its exit status,
    // and set -e killed the script after the sheet was already gone — leaving
    // the APT hook behind to reinstate the theme on the next dpkg run.
    run('install', SHEET, '--fonts', fontsSrc, '--register', '--apt-hook');
    const result = run('uninstall', 'sv-dark', '--purge-fonts');

    expect(result.status).toBe(0);
    expect(existsSync(p(THEMES, 'sv-fonts'))).toBe(false);
    expect(existsSync(p(HOOK))).toBe(false);
    expect(existsSync(p('usr/local/sbin/svnbjrn-design-theme'))).toBe(false);
    expect(readFileSync(p(LIB), 'utf8')).toBe(PRISTINE_LIB);
  });

  it('keeps fonts and the hook while another of our themes remains', () => {
    run('install', SHEET, '--fonts', fontsSrc, '--register', '--apt-hook');
    run('install', SHEET_LIGHT, '--register');
    expect(run('uninstall', 'sv-light', '--purge-fonts').status).toBe(0);
    expect(existsSync(p(THEMES, 'sv-fonts'))).toBe(true);
    expect(existsSync(p(HOOK))).toBe(true);
  });

  it('refuses to overwrite or delete a theme the distribution owns', () => {
    // crisp and proxmox-dark satisfy the name rule too; only the header marker
    // distinguishes ours.
    write(p(THEMES, 'theme-proxmox-dark.css'), '/* proxmox */\n');
    const stolen = join(root, 'theme-proxmox-dark.css');
    writeFileSync(stolen, readFileSync(SHEET));

    expect(run('install', stolen).status).not.toBe(0);
    expect(readFileSync(p(THEMES, 'theme-proxmox-dark.css'), 'utf8')).toBe('/* proxmox */\n');
    expect(run('uninstall', 'proxmox-dark').status).not.toBe(0);
    expect(existsSync(p(THEMES, 'theme-proxmox-dark.css'))).toBe(true);
  });

  it('restores proxmoxlib.js byte-for-byte and patches only the first theme_map', () => {
    write(p(LIB), `${PRISTINE_LIB}var decoy = { theme_map: { foo: 'bar' } };\n`);
    run('install', SHEET, '--register');
    const patched = readFileSync(p(LIB), 'utf8');
    expect(patched.match(/svnbjrn-design:sv-dark/g)).toHaveLength(1);
    expect(patched).toContain("var decoy = { theme_map: { foo: 'bar' } };");

    run('uninstall', 'sv-dark');
    expect(readFileSync(p(LIB), 'utf8')).toBe(
      `${PRISTINE_LIB}var decoy = { theme_map: { foo: 'bar' } };\n`
    );
  });

  it('re-registers via the register verb after an upgrade wipes proxmoxlib.js', () => {
    run('install', SHEET, '--fonts', fontsSrc, '--register', '--apt-hook');
    write(p(LIB), PRISTINE_LIB); // the upgrade
    expect(readFileSync(p(LIB), 'utf8')).not.toContain('svnbjrn-design');

    // Exactly what the APT hook invokes.
    expect(run('register').status).toBe(0);
    expect(readFileSync(p(LIB), 'utf8')).toContain('svnbjrn-design:sv-dark');
  });

  it('writes an APT hook that calls register and keeps its output', () => {
    run('install', SHEET, '--fonts', fontsSrc, '--register', '--apt-hook');
    const hook = readFileSync(p(HOOK), 'utf8');
    const command = /DPkg::Post-Invoke \{ "(.*)"; \};/.exec(hook);
    expect(command).not.toBeNull();
    expect(command[1]).toMatch(/svnbjrn-design-theme register\b/);
    // Replaying the whole install path is how the same-file bug hid here.
    expect(command[1]).not.toMatch(/\binstall\b/);
    // A silent failure is how it stayed hidden.
    expect(command[1]).toContain('logger -t');
    expect(command[1]).not.toContain('>/dev/null');
  });

  it('rejects a name Proxmox could never select', () => {
    const bad = join(root, 'theme-sv-world2.css');
    writeFileSync(bad, readFileSync(SHEET));
    const result = run('install', bad);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/not a selectable Proxmox theme name/);
  });

  it('bounds proxmoxlib.js backups instead of growing one per upgrade', () => {
    run('install', SHEET, '--register');
    for (let i = 0; i < 6; i += 1) {
      write(p(LIB), PRISTINE_LIB);
      run('register');
    }
    const backups = spawnSync('bash', ['-c', `ls ${p(LIB)}.bak-* | wc -l`], { encoding: 'utf8' });
    expect(Number(backups.stdout.trim())).toBeLessThanOrEqual(3);
  });
});

describe('installer/emitter shared constants', () => {
  const script = readFileSync(SCRIPT, 'utf8');

  it('ships exactly the font files the sheets reference', () => {
    // Duplicated between emit.ts and the installer, previously kept in sync by
    // a comment. Adding a face to one and not the other fails silently: that
    // face just falls back to the system stack on every node.
    const declared = /FONT_FILES=\(([^)]*)\)/.exec(script);
    expect(declared).not.toBeNull();
    const inScript = new Set(declared[1].split(/\s+/).filter((s) => s.endsWith('.woff2')));
    const referenced = new Set(
      [...readFileSync(SHEET, 'utf8').matchAll(/url\('sv-fonts\/([^']+)'\)/g)].map((m) => m[1])
    );
    expect(inScript).toEqual(referenced);
  });

  it('validates theme names with the same rule as the emitter', () => {
    // The shell cannot import the TS check, so the pattern is duplicated.
    const inScript = /grep -Eq '(\^[^']+)'/.exec(script);
    expect(inScript).not.toBeNull();
    expect(inScript[1]).toBe('^[a-z]{1,10}(-[a-z]{1,10}){0,5}$');
  });
});
