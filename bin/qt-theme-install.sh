#!/usr/bin/env bash
# Vendoring installer for @svnbjrn/design Qt themes.
#
# Copies the PySide6 runtime helper, one theme's QSS, and its QPalette JSON
# flat into an existing destination directory (typically an importable Python
# package), so a Python project can vendor the theme without depending on this
# package at runtime. Copy-only: nothing is deleted and no unrelated artifact
# is copied.
#
# Usage:
#   qt-theme-install.sh --theme <name> --dest <existing-dir> [--from <root>] [--fonts]
#
# Artifact root resolution (first complete layout wins, never mixed):
#   <root>/dist      package build output
#   <root>/src/lib   source tree
#   <root>           flat/direct artifact root
# A layout is complete only when it carries qss/<theme>.qss AND
# qt/<theme>.palette.json. --from defaults to the package root
# (the installer's parent directory).
#
# Exit codes: 0 installed (idempotent), 2 argument/syntax error,
# 1 preflight or filesystem error.

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: qt-theme-install.sh --theme <name> --dest <existing-dir> [--from <root>] [--fonts]

Copy the @svnbjrn/design Qt runtime helper, one theme's QSS, and its QPalette
JSON flat into an existing destination directory.

Options:
  --theme <name>   Theme to install: dark, light, or amber.
                   Lowercase kebab-case, ^[a-z][a-z0-9-]{0,63}$.
  --dest <dir>     Existing writable destination directory (never created).
  --from <root>    Artifact root (default: the package root beside bin/).
  --fonts          Also copy every WOFF2 font into <dest>/sv-fonts.
  --help           Show this help and exit.

Exit codes: 0 installed, 2 argument error, 1 preflight/filesystem error.
EOF
}

syntax_error() {
  echo "qt-theme-install.sh: error: $*" >&2
  usage >&2
  exit 2
}

die() {
  echo "qt-theme-install.sh: error: $*" >&2
  exit 1
}

THEME=""
DEST=""
FROM=""
FONTS=0
SEEN_THEME=0
SEEN_DEST=0
SEEN_FROM=0
SEEN_FONTS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help)
      usage
      exit 0
      ;;
    --theme)
      [[ $SEEN_THEME -eq 1 ]] && syntax_error "duplicate --theme"
      [[ $# -ge 2 ]] || syntax_error "--theme requires a value"
      THEME="$2"
      SEEN_THEME=1
      shift 2
      ;;
    --dest)
      [[ $SEEN_DEST -eq 1 ]] && syntax_error "duplicate --dest"
      [[ $# -ge 2 ]] || syntax_error "--dest requires a value"
      DEST="$2"
      SEEN_DEST=1
      shift 2
      ;;
    --from)
      [[ $SEEN_FROM -eq 1 ]] && syntax_error "duplicate --from"
      [[ $# -ge 2 ]] || syntax_error "--from requires a value"
      FROM="$2"
      SEEN_FROM=1
      shift 2
      ;;
    --fonts)
      [[ $SEEN_FONTS -eq 1 ]] && syntax_error "duplicate --fonts"
      FONTS=1
      SEEN_FONTS=1
      shift
      ;;
    *)
      syntax_error "unknown argument: $1"
      ;;
  esac
done

[[ $SEEN_THEME -eq 1 ]] || syntax_error "--theme is required"
[[ $SEEN_DEST -eq 1 ]] || syntax_error "--dest is required"
[[ "$THEME" =~ ^[a-z][a-z0-9-]{0,63}$ ]] || syntax_error "unsafe theme name: $THEME"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HELPER="$SCRIPT_DIR/sv_design_qt.py"
[[ -n "$FROM" ]] || FROM="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Preflight: every check completes before any cp/mkdir ──────────────────

[[ -d "$DEST" ]] || die "destination does not exist: $DEST"
[[ -w "$DEST" ]] || die "destination is not writable: $DEST"
[[ -f "$HELPER" && -r "$HELPER" ]] || die "missing runtime helper beside installer: $HELPER (sv_design_qt.py)"

CANDIDATE=""
for candidate in "$FROM/dist" "$FROM/src/lib" "$FROM"; do
  if [[ -f "$candidate/qss/$THEME.qss" && -f "$candidate/qt/$THEME.palette.json" ]]; then
    CANDIDATE="$candidate"
    break
  fi
done
[[ -n "$CANDIDATE" ]] || die "no complete artifact layout for theme '$THEME' under: $FROM (checked dist/, src/lib/, and the root)"

QSS_SRC="$CANDIDATE/qss/$THEME.qss"
PALETTE_SRC="$CANDIDATE/qt/$THEME.palette.json"
[[ -r "$QSS_SRC" ]] || die "unreadable QSS: $QSS_SRC"
[[ -r "$PALETTE_SRC" ]] || die "unreadable palette: $PALETTE_SRC"

FONT_SRCS=()
if [[ $FONTS -eq 1 ]]; then
  shopt -s nullglob
  FONT_SRCS=("$CANDIDATE"/fonts/*.woff2)
  shopt -u nullglob
  [[ ${#FONT_SRCS[@]} -gt 0 ]] || die "no WOFF2 fonts found under: $CANDIDATE/fonts"
  for font in "${FONT_SRCS[@]}"; do
    [[ -r "$font" ]] || die "unreadable font: $font"
  done
fi

# ── Install: overwrite semantics with a same-file guard, delete nothing ────

install_file() {
  local src="$1" dst="$2"
  if [[ "$src" -ef "$dst" ]]; then
    return 0
  fi
  cp -f "$src" "$dst"
}

install_file "$HELPER" "$DEST/sv_design_qt.py"
install_file "$QSS_SRC" "$DEST/$THEME.qss"
install_file "$PALETTE_SRC" "$DEST/$THEME.palette.json"

if [[ $FONTS -eq 1 ]]; then
  mkdir -p "$DEST/sv-fonts"
  for font in "${FONT_SRCS[@]}"; do
    install_file "$font" "$DEST/sv-fonts/$(basename "$font")"
  done
fi

echo "installed theme '$THEME' into $DEST"
