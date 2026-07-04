# Visual testing with Argos

Every story doubles as a visual regression test. The `storybook` Vitest project
renders each story in headless Chromium (via `@storybook/addon-vitest`), and
[Argos](https://argos-ci.com/docs/storybook) captures one screenshot per story
per theme — dark and light, driven through the same `data-theme` contract the
library ships. CI uploads them to
[app.argos-ci.com/argos-ci-2/design-system](https://app.argos-ci.com/argos-ci-2/design-system),
where each PR's diffs are reviewed against the `main` baseline.

**What runs:** 40 stories × {dark, light} = 80 screenshots per build.
The Hobby plan allows 5,000 screenshots/month (~62 builds).

## Run locally

```bash
pnpm exec playwright install chromium   # once
pnpm run test:visual                    # renders stories, writes ./screenshots
```

PNGs land in `./screenshots` (gitignored), suffixed ` mode-[dark]` /
` mode-[light]`. Nothing uploads without `CI` in the environment; `pnpm test`
and `pnpm test:watch` stay unit-only (jsdom).

## Review workflow

- Each PR gets an **argos** status check; click through to approve or reject
  diffs per screenshot. Builds on `main` become the auto-approved baseline.
- A PR build shows as **orphan** until `main` has run the workflow once.
- `argos deploy` publishes the built Storybook at a per-build preview URL,
  linked from the build page.

## Theme coverage

Both themes are captured project-wide via `parameters.argos.modes` in
`.storybook/preview.ts` (the `theme` global drives `withThemeByDataAttribute`).
To skip one theme for a single story:

```svelte
<Story name="…" parameters={{ argos: { modes: { light: { disabled: true } } } }} />
```

(Note: the SDK checks `disabled`, not `disable` as some docs show.)

Captures are content-cropped at 2× zoom by default (`fitToContent`, 16px
padding). For a full-page capture instead:
`parameters: { argos: { fitToContent: false } }`.

## Integration gotchas (learned the hard way)

- **`vitest` and `@vitest/browser-playwright` must be bumped in lockstep** —
  the provider peer-pins the exact Vitest version.
- **`.storybook/vitest.setup.ts` is required.** The addon's auto-provisioned
  annotations module fails to load under this pnpm + browser-mode setup; the
  explicit `setProjectAnnotations` file (same pattern as the Argos SDK's own
  e2e suite) replaces it.
- **`svelte()` must be listed in the `storybook` project's Vite plugins** —
  `@storybook/svelte-vite` does not add the Svelte compiler itself; in
  `storybook dev` it comes from `vite.config.ts`, which Vitest never reads.
- **The capture viewport is set in `.storybook/vitest.setup.ts`**, via a
  test-only `parameters.viewport` annotation (1200×3200). `addon-vitest`
  resizes the tester iframe per story from that parameter (default 1200×900)
  and ignores Vitest's own `browser.viewport`; Argos screenshots the iframe's
  body at 2× zoom, and pixels beyond the iframe rasterize as blank — the
  height must exceed the tallest story at that zoom.

## Keeping screenshots stable

- Text rendering is stabilized with `--disable-lcd-text
  --font-render-hinting=none` (set in `vitest.config.ts`); fonts are
  self-hosted and subset, so there's no CDN variance.
- Avoid time-, locale-, or randomness-dependent story content.
- Renaming a story or mode creates a new baseline (the old one reads as
  removed).
- If a diff is pure noise, re-run the job; if one story keeps flaking in a
  mode, disable that mode for it and investigate.

## Reference

- [Argos Storybook SDK](https://argos-ci.com/docs/storybook)
- [Argos CLI (`argos deploy`)](https://argos-ci.com/docs/argos-cli)
- [Build modes & baselines](https://argos-ci.com/docs/build-modes)
- [Stabilize text rendering](https://argos-ci.com/docs/stabilize-text-rendering)
