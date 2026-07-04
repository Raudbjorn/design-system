// CLI contract tests — spawn the real bin against src (DESIGN_GENERATE_SRC
// avoids a stale dist shadowing the working tree).

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const BIN = join(process.cwd(), 'bin/design-generate.mjs');

const run = (...args) =>
  spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, DESIGN_GENERATE_SRC: '1' }
  });

describe('design-generate CLI', () => {
  it('emits {theme, report} JSON on stdout, exit 0', () => {
    const result = run('--seeds', '#c9a227,#b5473a', '--name', 'grimdark-hive', '--hints', 'grimdark');
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.theme.name).toBe('grimdark-hive');
    expect(payload.theme.extends).toBe('dark');
    expect(payload.report.checks.every((c) => c.pass)).toBe(true);
  });

  it('matches the library output byte-for-byte and is deterministic', async () => {
    const { generateTheme } = await import('../src/lib/generate/index.ts');
    const lib = generateTheme({
      seeds: ['#c9a227', '#b5473a'],
      name: 'grimdark-hive',
      mode: 'auto',
      hints: ['grimdark']
    });
    const a = run('--seeds', '#c9a227,#b5473a', '--name', 'grimdark-hive', '--hints', 'grimdark');
    const b = run('--seeds', '#c9a227,#b5473a', '--name', 'grimdark-hive', '--hints', 'grimdark');
    expect(a.stdout).toBe(b.stdout);
    expect(lib.ok).toBe(true);
    if (lib.ok) expect(JSON.parse(a.stdout)).toEqual(JSON.parse(JSON.stringify(lib.value)));
  });

  it('--theme-only emits the bare package', () => {
    const result = run('--seeds', '#c9a227', '--name', 'w', '--theme-only');
    const payload = JSON.parse(result.stdout);
    expect(payload.report).toBeUndefined();
    expect(payload.tokens.bg).toBeDefined();
  });

  it('invalid input → exit 2 with a GenError on stderr, empty stdout', () => {
    const result = run('--seeds', 'red', '--name', 'w');
    expect(result.status).toBe(2);
    expect(result.stdout).toBe('');
    expect(JSON.parse(result.stderr)).toMatchObject({ kind: 'invalid-seed', index: 0 });
  });

  it('missing required args → exit 2 with usage', () => {
    const result = run('--name', 'w');
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('usage:');
  });

  it('--strict exits 3 when warnings are present', () => {
    // All-gray seeds always warn (achromatic-seeds).
    const result = run('--seeds', '#808080', '--name', 'w', '--strict');
    expect(result.status).toBe(3);
    expect(JSON.parse(result.stdout).report.warnings.length).toBeGreaterThan(0);
  });
});
