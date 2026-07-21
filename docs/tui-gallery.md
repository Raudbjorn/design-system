# Native TUI gallery

The Raudbjorn native TUI lives in `crates/raudbjorn-tui` alongside the Svelte
package. It is a development and verification surface, not an npm export.

## Ownership model

- `crates/raudbjorn-tui/templates/*.crepus` contains the production terminal
  component, pane, and View templates. Do not duplicate those components in
  imperative Ratatui widgets.
- `crates/raudbjorn-tui/src/catalog` is the typed story inventory, fixture
  source, and event-reducer layer. Story IDs are stable snapshot keys.
- `src/lib/index.ts` remains the web-component inventory. The catalog coverage
  test classifies every exported web component and fails on an unclassified
  addition.
- `scripts/emitters/emit-tui-rust.mjs` generates
  `crates/raudbjorn-tui/src/theme/generated.rs` from the same resolved DTCG
  palettes used by the web and QSS outputs. Never edit the generated Rust file.
- Ratatui `Buffer` snapshots are the automated rendering oracle. The HTML
  mockups remain design-intent references, not executable specifications.

## Launch and inspect

Node.js 22 or newer, pinned `pnpm@11.3.0`, and Rust 1.96.1 are required.

```bash
pnpm install --frozen-lockfile
pnpm run tui:gallery
pnpm run tui:list

# Open one story directly in the interactive terminal.
cargo run -p raudbjorn-tui --example gallery -- --story view/homelab-healthy

# Produce a deterministic plain-text dump without taking over the terminal.
cargo run -q -p raudbjorn-tui --example gallery -- \
  --dump button/primary --width 40 --height 5
```

`--list` prints `story-id`, group, and name as tab-separated fields. `--dump`
defaults to 80×24 and accepts `--width` and `--height`; an unknown story or a
zero dimension exits non-zero.

## Keyboard map

The Frame-native browser receives complete Crossterm events, including
modifiers.

| Scope | Keys | Behavior |
| --- | --- | --- |
| Browser | `Up`/`Down`, `Home`/`End` | Move through the story catalog |
| Browser | `Tab`/`Shift+Tab` | Move focus between the story list and preview |
| Browser | `f` | Open the selected story without browser chrome |
| Preview | `Esc` | Return focus to the story list |
| Fullscreen | `f` or `Esc` | Return to the browser chrome |
| Browser/fullscreen | `t` | Toggle the dark/light palette |
| Browser/fullscreen | `q` | Quit |
| Button/Link | `Enter`, `Space` | Activate |
| Input | text, paste, `Backspace` | Edit the value |
| Select | `Up`/`Down`, `PageUp`/`PageDown`, `Enter`, `Esc` | Open, move, and close |
| Checkbox/Switch | `Space` | Toggle |
| Radio | arrows | Move selection |
| Tabs | `Left`/`Right`, `Home`/`End` | Move the active tab |
| Table | `Up`/`Down`, `Home`/`End` | Move row selection |
| Tooltip | `?` | Toggle contextual help |
| Journal | `Up`/`PageUp`, `End` | Pin history or return to `FOLLOWING` |
| Modal/Sheet | `Esc` or outside click | Close once and restore prior focus |

Modal and Sheet handlers receive events before browser shortcuts, so their
background cannot consume `q`, `t`, or `f`. All `view/*` stories open
fullscreen by default; the browser chrome-free rendering path has a regression
test.

## Viewport contract

- **80×24** is the supported full-View floor.
- **120×30** is the target Homelab composition.
- **160×50** caps content at 120 columns rather than stretching it without
  bound.
- **40×12** is the binding fallback: full Views render only
  `Terminal too small — requires 80×24, current 40×12`.
- The gallery browser itself requires at least 40×12.

## Color and glyph profiles

The gallery defaults to truecolor Unicode. Override it per process:

```bash
RAUDBJORN_TUI_COLOR=ansi16 pnpm run tui:gallery
RAUDBJORN_TUI_COLOR=mono RAUDBJORN_TUI_GLYPHS=ascii pnpm run tui:gallery
NO_COLOR=1 RAUDBJORN_TUI_GLYPHS=ascii pnpm run tui:gallery
```

`RAUDBJORN_TUI_COLOR` accepts `truecolor`, `ansi256`, `ansi16`, `ansi8`,
`mono`, or `no-color`. `RAUDBJORN_TUI_GLYPHS` accepts `unicode` or `ascii`.
Unknown values are errors. State and focus must remain legible without color;
Unicode semantic glyphs have one-cell ASCII fallbacks. This is not a claim of
terminal screen-reader conformance because no dependency exposes a verified
assistive-technology contract.

## Automated rendering review

Run the focused and release gates from the repository root:

```bash
pnpm run tui:check
pnpm run tui:test
pnpm run tui:smoke
cargo test -p raudbjorn-tui snapshot_release_matrix -- --nocapture
```

Snapshots live under `crates/raudbjorn-tui/tests/snapshots`. Each file begins
with `width=<W> height=<H>`, then records every cell in row-major order as:

```text
x,y:escaped-symbol|foreground|background|underline|modifiers
```

Backslash, pipe, carriage return, newline, and tab are escaped. Snapshot keys
include the stable story ID, theme, color/glyph profile, and viewport. Animated
stories use an injected fixed tick; snapshots never read wall-clock time.
Missing snapshots fail. Regeneration is always explicit:

```bash
UPDATE_SNAPSHOTS=1 cargo test -p raudbjorn-tui --test snapshots -- --nocapture
cargo test -p raudbjorn-tui --test snapshots -- --nocapture
```

Review the resulting snapshot diff before accepting it. The second command,
without update mode, is the binding verification.

## Browser implementation and Pantry status

The shipped gallery uses the plan's Frame-native browser path. It renders the
same Crepus templates and catalog contexts as snapshots, preserves complete
Crossterm events, supports modal/sheet isolation, and renders Views without
browser chrome. `tui-pantry` is not a dependency or feature of this crate;
therefore Pantry's `KeyCode`-only callback limitation does not apply to this
browser. Pantry 0.4.0 remains an evaluated alternative, not part of the
dependency graph, production surface, or correctness boundary.

## Human visual release gate

Automated Buffer tests do not prove emulator or font aesthetics. Before a
visual release, inspect the production gallery in installed Kitty and XTerm,
plus tmux at 80×24. Review 80×24, 120×30, and 160×50 in truecolor Unicode,
then ANSI 16, mono/no-color, and ASCII for Button, Input error, Select open,
Alert tones, Table rich cells, Modal, Sheet, and every Homelab View.

Use these installed-emulator launch commands for the first 80×24 pass:

```bash
# Kitty, truecolor Unicode, 80×24.
/usr/bin/kitty -o initial_window_width=80c -o initial_window_height=24c \
  sh -lc 'cd /home/svnbjrn/projects/design-system && exec env RAUDBJORN_TUI_COLOR=truecolor RAUDBJORN_TUI_GLYPHS=unicode cargo run -p raudbjorn-tui --example gallery'

# XTerm, ANSI 16 Unicode, 80×24.
/usr/bin/xterm -geometry 80x24 -e sh -lc \
  'cd /home/svnbjrn/projects/design-system && exec env RAUDBJORN_TUI_COLOR=ansi16 RAUDBJORN_TUI_GLYPHS=unicode cargo run -p raudbjorn-tui --example gallery'

# tmux inside XTerm, mono ASCII, 80×24.
/usr/bin/xterm -geometry 80x24 -e sh -lc \
  'cd /home/svnbjrn/projects/design-system && exec /usr/bin/tmux -f /dev/null new-session "env RAUDBJORN_TUI_COLOR=mono RAUDBJORN_TUI_GLYPHS=ascii cargo run -p raudbjorn-tui --example gallery"'
```

Repeat the Kitty and XTerm commands at 120×30 and 160×50 by changing the
`initial_window_*` or `-geometry` values. Set `RAUDBJORN_TUI_COLOR` to
`truecolor`, `ansi16`, `mono`, or `no-color`, and set
`RAUDBJORN_TUI_GLYPHS` to `unicode` or `ascii`. Append
`-- --story <story-id>` to the Cargo command when reviewing one required story
in isolation.

Record `ACCEPT` with capture paths only after focus and location remain obvious
without color, all actions are reachable, glyphs do not overwrite neighboring
cells, 80×24 Views remain usable, 40×12 shows only the fallback, and 160×50
avoids uncontrolled empty cards. Until that record exists, the release status
is `PENDING_HUMAN_VISUAL_REVIEW`.

### Review record

- **2026-07-21:** Human review found the gallery visually sound but rejected
  Markdown-looking `#`/`##`/`###` heading prefixes as ambiguous. The follow-up
  audit also removed redundant `**bold**`, `` `mono` ``, `*emphasis*`, and
  `* ONLINE` decoration in favor of Ratatui modifiers and terminal-native
  labels. Thirty structured snapshots changed across `heading/*`,
  `text/{strong,muted,faint,mono}`, `card/emphasis`, and `timeline/status`;
  unrelated Modal drift was detected and rejected before regeneration.
- The reviewer returned `ACCEPT` after the post-fix spot-check but retained no
  captures. The approved gate requires capture paths, so the binding release
  status remains `PENDING_HUMAN_VISUAL_REVIEW`.
