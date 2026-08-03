#!/usr/bin/env bash
# proxmox-theme-install.sh — install @svnbjrn/design ExtJS themes into a
# Proxmox VE / Backup Server / Mail Gateway node.
#
# Proxmox has no supported extension hook for themes: a theme is a CSS file in
# the widget toolkit's themes directory, selected by a per-product cookie. This
# script copies the file (plus the self-hosted fonts it references), and can
# optionally register the theme in the UI's theme picker and keep that
# registration alive across package upgrades.
#
#   proxmox-theme-install.sh install dist/extjs/theme-sv-dark.css \
#       [--fonts dist/fonts] [--register] [--apt-hook]
#   proxmox-theme-install.sh uninstall sv-dark [--purge-fonts]
#   proxmox-theme-install.sh status
#
# Everything it touches lives under /usr/share/javascript/proxmox-widget-toolkit
# (plus the APT hook under /etc/apt/apt.conf.d). index.html.tpl is never
# modified — that file is what older community themes patch, and it is the part
# that breaks loudly on upgrade.

set -euo pipefail

# SV_PREFIX exists so the script can be exercised against a fixture tree
# instead of a live node; it is empty in every real invocation.
PREFIX=${SV_PREFIX:-}
THEME_DIR=$PREFIX/usr/share/javascript/proxmox-widget-toolkit/themes
LIB_JS=$PREFIX/usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js
FONT_DIR="$THEME_DIR/sv-fonts"
HOOK_FILE=$PREFIX/etc/apt/apt.conf.d/99-svnbjrn-design-theme
SELF_INSTALLED=$PREFIX/usr/local/sbin/svnbjrn-design-theme
MARKER='svnbjrn-design'
# What the generated sheets carry in their header comment, used to tell our
# themes apart from the ones Proxmox ships.
CSS_MARKER='@svnbjrn/design'

# Fonts referenced by the generated @font-face blocks. Kept in sync with
# FONT_FILES in src/lib/extjs/emit.ts.
FONT_FILES=(
  InterVariable.woff2
  InterVariable-Italic.woff2
  Iosevka-Regular.woff2
  Iosevka-Bold.woff2
)

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

note() {
  printf '%s\n' "$1" >&2
}

require_root() {
  if [ -n "$PREFIX" ]; then
    return 0
  fi
  [ "$(id -u)" -eq 0 ] || die "must run as root (writes under /usr/share and /etc)"
}

# PVE and PMG validate the cookie server-side against this pattern. A name that
# fails it installs fine and can then never be selected — reject it up front
# rather than leaving a file nobody can use.
check_name() {
  local name=$1
  printf '%s' "$name" | grep -Eq '^[a-z]{1,10}(-[a-z]{1,10}){0,5}$' ||
    die "\"$name\" is not a selectable Proxmox theme name: PVE and PMG require ^[a-z]{1,10}(-[a-z]{1,10}){0,5}\$ (lowercase letters and hyphens, no digits)"
}

theme_name_from_file() {
  local base
  base=$(basename "$1")
  case "$base" in
    theme-*.css) printf '%s' "${base#theme-}" | sed 's/\.css$//' ;;
    *) die "expected a file named theme-<name>.css, got \"$base\"" ;;
  esac
}

detect_product() {
  if [ -d "$PREFIX/usr/share/pve-manager" ]; then
    printf 'PVE 8006'
  elif [ -d "$PREFIX/usr/share/javascript/proxmox-backup" ] || [ -d "$PREFIX/usr/share/proxmox-backup" ]; then
    printf 'PBS 8007'
  elif [ -d "$PREFIX/usr/share/pmg-gui" ]; then
    printf 'PMG 8006'
  else
    printf 'unknown 8006'
  fi
}

cmd_install() {
  require_root
  local css=$1
  shift
  local fonts_src='' do_register=0 do_hook=0

  while [ $# -gt 0 ]; do
    case "$1" in
      --fonts)
        [ $# -ge 2 ] || die "--fonts needs a directory"
        fonts_src=$2
        shift 2
        ;;
      --register) do_register=1; shift ;;
      --apt-hook) do_hook=1; shift ;;
      *) die "unknown option \"$1\"" ;;
    esac
  done

  [ -f "$css" ] || die "no such file: $css"
  [ -d "$THEME_DIR" ] || die "$THEME_DIR does not exist — is proxmox-widget-toolkit installed?"

  local name
  name=$(theme_name_from_file "$css")
  check_name "$name"

  install -m 0644 "$css" "$THEME_DIR/theme-$name.css"
  [ -f "$THEME_DIR/theme-$name.css" ] || die "copy to $THEME_DIR failed"
  note "installed $THEME_DIR/theme-$name.css"

  # The sheet's @font-face rules point at sv-fonts/ next to it. Without the
  # files the theme still works, it just falls back to the system stack — so a
  # missing --fonts is a warning, not a failure.
  if [ -n "$fonts_src" ]; then
    [ -d "$fonts_src" ] || die "no such directory: $fonts_src"
    mkdir -p "$FONT_DIR"
    local file missing=0
    for file in "${FONT_FILES[@]}"; do
      if [ -f "$fonts_src/$file" ] && [ "$fonts_src/$file" -ef "$FONT_DIR/$file" ]; then
        : # already in place — the APT hook re-runs with --fonts pointing here,
          # and install(1) errors on a same-file copy, which would abort the
          # re-registration that the hook exists to perform.
      elif [ -f "$fonts_src/$file" ]; then
        install -m 0644 "$fonts_src/$file" "$FONT_DIR/$file"
      else
        note "warning: $fonts_src/$file not found, skipping"
        missing=1
      fi
    done
    if [ "$missing" -eq 0 ]; then
      note "installed fonts into $FONT_DIR"
    fi
  elif ! [ -d "$FONT_DIR" ]; then
    note "warning: no --fonts given and $FONT_DIR is absent — the theme will fall back to system fonts"
  fi

  if [ "$do_register" -eq 1 ]; then
    register_theme "$name"
  fi
  if [ "$do_hook" -eq 1 ]; then
    install_hook "$css" "$fonts_src"
  fi

  local product port
  read -r product port <<<"$(detect_product)"
  note ""
  note "Select it in the UI, or set the cookie by hand:"
  note "  document.cookie = '${product}ThemeCookie=$name; path=/; max-age=31536000'"
  note "then reload https://<node>:$port/"
  if [ "$do_register" -eq 0 ]; then
    note "(without --register the theme works but is not listed in the theme picker)"
  fi
}

# Adds one entry to Proxmox.Utils.theme_map so the theme shows up in the
# picker. The map is a hardcoded object literal in proxmoxlib.js; there is no
# supported hook, so this is a patch, done with a backup and verified after.
register_theme() {
  local name=$1
  [ -f "$LIB_JS" ] || die "$LIB_JS not found — cannot register the theme"

  if grep -q "$MARKER:$name" "$LIB_JS"; then
    note "theme \"$name\" already registered in $LIB_JS"
    return 0
  fi

  grep -q 'theme_map' "$LIB_JS" ||
    die "no theme_map found in $LIB_JS — the widget toolkit layout changed; install without --register and use the cookie"

  local backup label
  backup="$LIB_JS.bak-$(date +%Y%m%d%H%M%S)"
  cp -a "$LIB_JS" "$backup"
  # sv-dark -> "SV Dark": the picker lists it beside Proxmox's own entries, so
  # it needs to read as a distinct theme rather than a bare word.
  label="SV $(printf '%s' "$name" | sed 's/^sv-//; s/-/ /g; s/\b\(.\)/\u\1/g')"

  # Insert immediately after the opening brace of the theme_map literal,
  # tolerating both "theme_map: {" and the whitespace-free form. The 0,/re/
  # range stops at the first match so a second mention of theme_map elsewhere
  # in the bundle cannot pick up a duplicate entry.
  sed -i "0,/theme_map:[[:space:]]*{/s|theme_map:[[:space:]]*{|&'$name': '$label', /* $MARKER:$name */|" "$LIB_JS"

  if ! grep -q "$MARKER:$name" "$LIB_JS"; then
    cp -a "$backup" "$LIB_JS"
    die "theme_map patch did not apply; restored $LIB_JS from $backup"
  fi
  note "registered \"$name\" in the theme picker (backup: $backup)"
}

unregister_theme() {
  local name=$1
  [ -f "$LIB_JS" ] || return 0
  grep -q "$MARKER:$name" "$LIB_JS" || return 0

  local backup
  backup="$LIB_JS.bak-$(date +%Y%m%d%H%M%S)"
  cp -a "$LIB_JS" "$backup"
  # Remove exactly the entry this script inserted, not the whole map.
  sed -i "s|'$name': '[^']*', /\* $MARKER:$name \*/||" "$LIB_JS"

  if grep -q "$MARKER:$name" "$LIB_JS"; then
    cp -a "$backup" "$LIB_JS"
    die "could not remove the theme_map entry; restored $LIB_JS from $backup"
  fi
  note "unregistered \"$name\" (backup: $backup)"
}

# proxmox-widget-toolkit upgrades overwrite proxmoxlib.js, dropping the
# registration. The hook re-runs this script after every dpkg invocation.
install_hook() {
  local css=$1 fonts_src=$2
  install -m 0755 "${BASH_SOURCE[0]}" "$SELF_INSTALLED"
  install -m 0644 "$css" "$PREFIX/usr/local/share/$(basename "$css")"

  local args
  args="install $PREFIX/usr/local/share/$(basename "$css") --register"
  if [ -n "$fonts_src" ]; then
    args="$args --fonts $FONT_DIR"
  fi

  cat >"$HOOK_FILE" <<EOF
// Installed by $MARKER — re-applies the ExtJS theme after package upgrades
// overwrite proxmoxlib.js. Remove with: proxmox-theme-install.sh uninstall <name>
DPkg::Post-Invoke { "test -x $SELF_INSTALLED && $SELF_INSTALLED $args >/dev/null 2>&1 || true"; };
EOF
  [ -f "$HOOK_FILE" ] || die "failed to write $HOOK_FILE"
  note "installed APT hook $HOOK_FILE"
}

cmd_uninstall() {
  require_root
  local name=$1
  shift
  local purge_fonts=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --purge-fonts) purge_fonts=1; shift ;;
      *) die "unknown option \"$1\"" ;;
    esac
  done
  check_name "$name"

  unregister_theme "$name"

  if [ -f "$THEME_DIR/theme-$name.css" ]; then
    rm -f "$THEME_DIR/theme-$name.css"
    note "removed $THEME_DIR/theme-$name.css"
  fi

  if [ "$purge_fonts" -eq 1 ] && [ -d "$FONT_DIR" ]; then
    # Another installed sheet may still reference sv-fonts/.
    local remaining
    remaining=$(grep -l "sv-fonts/" "$THEME_DIR"/theme-*.css 2>/dev/null | wc -l)
    if [ "$remaining" -eq 0 ]; then
      rm -rf "$FONT_DIR"
      note "removed $FONT_DIR"
    else
      note "kept $FONT_DIR — $remaining other theme(s) still reference it"
    fi
  fi

  if [ -f "$HOOK_FILE" ] && grep -q "theme-$name.css" "$HOOK_FILE"; then
    rm -f "$HOOK_FILE" "$SELF_INSTALLED" "$PREFIX/usr/local/share/theme-$name.css"
    note "removed $HOOK_FILE"
  fi

  note "the browser keeps the theme cookie — pick another theme in the UI to clear it"
}

cmd_status() {
  local product port
  read -r product port <<<"$(detect_product)"
  printf 'product:   %s (port %s)\n' "$product" "$port"
  printf 'theme dir: %s\n' "$THEME_DIR"

  if [ -d "$THEME_DIR" ]; then
    local found=0 file name
    for file in "$THEME_DIR"/theme-*.css; do
      [ -e "$file" ] || continue
      name=$(theme_name_from_file "$file")
      if grep -qF "$CSS_MARKER" "$file" 2>/dev/null; then
        found=1
        printf 'installed: %s' "$name"
        if [ -f "$LIB_JS" ] && grep -q "$MARKER:$name" "$LIB_JS"; then
          printf ' (registered)'
        else
          printf ' (cookie only)'
        fi
        printf '\n'
      fi
    done
    if [ "$found" -eq 0 ]; then
      printf 'installed: none\n'
    fi
  else
    printf 'installed: %s missing\n' "$THEME_DIR"
  fi

  if [ -d "$FONT_DIR" ]; then
    printf 'fonts:     %s (%s files)\n' "$FONT_DIR" "$(find "$FONT_DIR" -name '*.woff2' | wc -l)"
  else
    printf 'fonts:     not installed\n'
  fi

  if [ -f "$HOOK_FILE" ]; then
    printf 'apt hook:  %s\n' "$HOOK_FILE"
  else
    printf 'apt hook:  not installed\n'
  fi

  # Confirms the file is actually reachable over HTTP, not just on disk.
  if command -v curl >/dev/null 2>&1; then
    local path=/pwt/themes
    if [ "$product" = "PBS" ]; then
      path=/widgettoolkit/themes
    fi
    local file name
    for file in "$THEME_DIR"/theme-*.css; do
      [ -e "$file" ] || continue
      grep -qF "$CSS_MARKER" "$file" 2>/dev/null || continue
      name=$(theme_name_from_file "$file")
      if curl -ksf -o /dev/null "https://localhost:$port$path/theme-$name.css"; then
        printf 'serving:   %s/theme-%s.css OK\n' "$path" "$name"
      else
        printf 'serving:   %s/theme-%s.css NOT reachable\n' "$path" "$name"
      fi
    done
  fi
}

usage() {
  cat >&2 <<EOF
usage: $(basename "$0") install <theme-<name>.css> [--fonts <dir>] [--register] [--apt-hook]
       $(basename "$0") uninstall <name> [--purge-fonts]
       $(basename "$0") status
EOF
  exit 2
}

[ $# -ge 1 ] || usage
verb=$1
shift
case "$verb" in
  install) [ $# -ge 1 ] || usage; cmd_install "$@" ;;
  uninstall) [ $# -ge 1 ] || usage; cmd_uninstall "$@" ;;
  status) cmd_status ;;
  -h | --help | help) usage ;;
  *) die "unknown command \"$verb\"" ;;
esac
