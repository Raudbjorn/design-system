#!/usr/bin/env node
// design-generate — seed colors in, world-theme package JSON out.
//
//   design-generate --seeds "#8a4b2f,#2f6f8a" --name mistwood \
//     [--mode dark|light|auto] [--hints grimdark,neon] \
//     [--out theme.json] [--theme-only] [--pretty] [--strict]
//
// stdout carries EXACTLY one JSON document ({theme, report}, or the bare
// theme package with --theme-only); diagnostics go to stderr. Exit codes:
//   0 success (warnings allowed)     2 invalid input (GenError on stderr)
//   3 warnings present under --strict  1 unexpected crash
//
// BONES invokes this via subprocess and caches stdout keyed on
// (seeds, mode, hints, GENERATOR_VERSION) — output is byte-stable per engine.

import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';

const USAGE = `usage: design-generate --seeds "#hex,#hex" --name <world-id>
       [--mode dark|light|auto] [--hints a,b] [--out file]
       [--theme-only] [--pretty] [--strict]`;

// Sets exitCode rather than calling process.exit(): stdout/stderr are pipes
// under BONES's subprocess invocation, and a write past the OS pipe buffer
// (64KB on Linux) is asynchronous — exiting immediately after writing can
// truncate it before the kernel drains the pipe. Letting Node exit naturally
// once the event loop empties guarantees the write completes first.
const fail = (code, payload) => {
  process.stderr.write(`${typeof payload === 'string' ? payload : JSON.stringify(payload)}\n`);
  process.exitCode = code;
};

const loadGenerator = async () => {
  // Published consumers hit dist; in-repo dev and tests hit src via node's
  // native type stripping (DESIGN_GENERATE_SRC=1 forces src to avoid a stale
  // dist shadowing current sources).
  if (!process.env.DESIGN_GENERATE_SRC) {
    try {
      return await import('../dist/generate/index.js');
    } catch {
      /* fall through to src */
    }
  }
  return import('../src/lib/generate/index.ts');
};

const main = async () => {
  // pnpm forwards a literal `--` separator (`pnpm generate -- --seeds …`).
  const args = process.argv.slice(2);
  if (args[0] === '--') args.shift();
  const { values } = parseArgs({
    args,
    options: {
      seeds: { type: 'string' },
      name: { type: 'string' },
      mode: { type: 'string' },
      hints: { type: 'string' },
      out: { type: 'string' },
      'theme-only': { type: 'boolean' },
      pretty: { type: 'boolean' },
      strict: { type: 'boolean' },
      help: { type: 'boolean' }
    }
  });

  if (values.help || !values.seeds || !values.name) {
    fail(values.help ? 0 : 2, USAGE);
    return;
  }

  const { generateTheme } = await loadGenerator();
  const result = generateTheme({
    seeds: values.seeds.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
    name: values.name,
    mode: values.mode ?? 'auto',
    hints: values.hints ? values.hints.split(',').map((h) => h.trim()).filter((h) => h.length > 0) : []
  });

  if (!result.ok) {
    fail(2, result.error);
    return;
  }

  const { theme, report } = result.value;
  const payload = values['theme-only'] ? theme : { theme, report };
  const json = JSON.stringify(payload, null, values.pretty ? 2 : undefined) + '\n';
  if (values.out) {
    writeFileSync(values.out, json);
    process.stderr.write(`wrote ${values.out}\n`);
  } else {
    process.stdout.write(json);
  }

  if (values.strict && report.warnings.length > 0) {
    process.stderr.write(`${report.warnings.length} warning(s) under --strict\n`);
    process.exitCode = 3;
  }
};

main().catch((error) => {
  fail(1, error instanceof Error ? (error.stack ?? error.message) : String(error));
});
