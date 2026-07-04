// Vite lib build for the React adapter dist — uses the repo's own vite,
// @sveltejs/vite-plugin-svelte, and svelte versions (no extra toolchain).
// Output: .design-sync/react-dist/{index.js,index.css} — plain ESM with the
// svelte runtime bundled in and react/react-dom left external (the
// design-sync bundle shims those to window globals).
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const here = import.meta.dirname;

export default defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: resolve(here, 'index.js'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: resolve(here, '../react-dist'),
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: false,
    sourcemap: false,
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        assetFileNames: 'index[extname]',
      },
    },
  },
});
