#!/usr/bin/env node
// Build the React adapter dist for design-sync. Run AFTER `pnpm run build`
// (needs dist/). Wired as the second half of cfg.buildCmd.
//
// Steps:
//  1. .ds-sync/node_modules/@svnbjrn/design → repo root (self symlink) — the
//     converter runs with --node-modules .ds-sync/node_modules (react/react-dom
//     vendoring lives there, not in this Svelte repo), and its tokensPkg/
//     tokensGlob copy of dist/tokens/*.css resolves the package through this
//     link. Recreated idempotently.
//  2. .design-sync/node_modules → ../.ds-sync/node_modules — react-dist's
//     index.d.ts resolves @types/react through it (the converter's dts stage
//     runs ts-morph over that file).
//  3. vite lib build → .design-sync/react-dist/{index.js,index.css}.
//  4. Stamp react-dist/package.json (name + real version + types) and copy
//     index.d.ts — react-dist is the self-contained "React package" view of
//     the DS that the converter treats as PKG_DIR.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..');
const reactDist = join(repo, '.design-sync', 'react-dist');

function ensureLink(linkPath, target) {
  // Junction targets are stored absolute on Windows, so idempotency is
  // checked on resolved paths, not raw link text.
  const desired = resolve(dirname(linkPath), target);
  try {
    const st = lstatSync(linkPath);
    if (st.isSymbolicLink()) {
      if (resolve(dirname(linkPath), readlinkSync(linkPath)) === desired) return; // already correct
      unlinkSync(linkPath);
    } else if (st.isFile()) {
      unlinkSync(linkPath);
    } else {
      // A real directory here means the converter would silently resolve
      // through the wrong tree (usually residue of an npm/pnpm install run
      // inside .design-sync/). Continuing produces baffling downstream
      // type/token-resolution failures — fail loudly instead.
      console.error(`! ${linkPath} exists and is a real directory — expected a symlink to ${target}.`);
      console.error(`  Remove it and re-run: rm -rf '${linkPath}'`);
      process.exit(1);
    }
  } catch {
    /* absent — create below */
  }
  mkdirSync(dirname(linkPath), { recursive: true });
  // 'junction' lets directory links work on Windows without admin rights /
  // Developer Mode; the type argument is ignored on POSIX. Both call sites
  // link directories, so 'junction' is always the right type here.
  symlinkSync(target, linkPath, 'junction');
  console.error(`  link: ${linkPath} -> ${target}`);
}

// 1. self symlink for the tokens copy (converter reads <--node-modules>/<pkg>).
if (existsSync(join(repo, '.ds-sync', 'node_modules'))) {
  ensureLink(join(repo, '.ds-sync', 'node_modules', '@svnbjrn', 'design'), join('..', '..', '..'));
}
// 2. type-resolution symlink for react-dist/index.d.ts (@types/react lives in .ds-sync).
if (existsSync(join(repo, '.ds-sync', 'node_modules'))) {
  ensureLink(join(repo, '.design-sync', 'node_modules'), join('..', '.ds-sync', 'node_modules'));
}

// 3. compile.
if (!existsSync(join(repo, 'dist', 'index.js'))) {
  console.error('! dist/index.js missing — run `pnpm run build` first');
  process.exit(1);
}
execSync('npx vite build --config .design-sync/react-adapter/vite.config.mjs', {
  cwd: repo,
  stdio: 'inherit',
});

// 4. package view.
const version = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')).version ?? '0.0.0';
writeFileSync(
  join(reactDist, 'package.json'),
  JSON.stringify(
    {
      name: '@svnbjrn/design',
      version,
      type: 'module',
      module: './index.js',
      types: './index.d.ts',
      description: 'React adapter view of @svnbjrn/design (generated — source in .design-sync/react-adapter/)',
    },
    null,
    2,
  ) + '\n',
);
cpSync(join(here, 'index.d.ts'), join(reactDist, 'index.d.ts'));

for (const f of ['index.js', 'index.css', 'index.d.ts', 'package.json']) {
  if (!existsSync(join(reactDist, f))) {
    console.error(`! react-dist/${f} missing after build`);
    process.exit(1);
  }
}
console.error('react-adapter: built .design-sync/react-dist/ (index.js + index.css + index.d.ts)');
