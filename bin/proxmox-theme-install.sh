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

# Our sheets only. Proxmox owns theme-crisp*.css and theme-proxmox-dark.css,
# and their names pass check_name just fine — the header marker is the only
# thing that distinguishes ours, so it gates every write and every delete.
#
# A nullglob loop rather than `grep -l ... | wc -l`: grep exits non-zero when
# nothing matches, and under `set -euo pipefail` that status propagates through
# the pipe and kills the script. That is a real bug this script shipped with.
sv_theme_files() {
  local file
  shopt -s nullglob
  for file in "$THEME_DIR"/theme-*.css; do
    if grep -qF "$CSS_MARKER" "$file" 2>/dev/null; then
      printf '%s\n' "$file"
    fi
  done
  shopt -u nullglob
}

is_our_theme() {
  local target=$1
  [ -f "$target" ] || return 0 # absent: nothing to clobber
  grep -qF "$CSS_MARKER" "$target" 2>/dev/null
}

# Keeps the newest few and drops the rest: register_theme backs up on every
# APT-triggered re-registration, and proxmoxlib.js is ~1 MB in a directory dpkg
# owns and will not clean up.
prune_backups() {
  local keep=3 backups=() drop
  shopt -s nullglob
  # The names are YYYYmmddHHMMSS-pid, so the glob's lexical order is
  # chronological order — no need to stat or parse ls.
  backups=("$LIB_JS".bak-*)
  shopt -u nullglob
  drop=$((${#backups[@]} - keep))
  if [ "$drop" -gt 0 ]; then
    rm -f "${backups[@]:0:$drop}"
  fi
}

# Second granularity alone collides when install and uninstall land in the same
# second, which silently overwrites the earlier backup the restore path trusts.
backup_lib_js() {
  local path
  path="$LIB_JS.bak-$(date +%Y%m%d%H%M%S)-$$"
  cp -a "$LIB_JS" "$path"
  prune_backups
  printf '%s' "$path"
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

  local dest="$THEME_DIR/theme-$name.css"
  is_our_theme "$dest" ||
    die "$dest exists and was not written by this script — refusing to overwrite a theme the distribution owns (crisp, proxmox-dark and friends pass the name check too); pick another name"

  # install(1) errors on a same-file copy, which under set -e would abort the
  # run before anything after it.
  if ! [ "$css" -ef "$dest" ]; then
    install -m 0644 "$css" "$dest"
  fi
  [ -f "$dest" ] || die "copy to $THEME_DIR failed"
  note "installed $dest"

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
    install_hook
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
  backup=$(backup_lib_js)
  # sv-dark -> "SV Dark": the picker lists it beside Proxmox's own entries, so
  # it needs to read as a distinct theme rather than a bare word.
  label="SV $(printf '%s' "$name" | sed 's/^sv-//; s/-/ /g; s/\b\(.\)/\u\1/g')"

  # Insert immediately after the opening brace of the theme_map literal.
  # Tolerates "theme_map: {", the whitespace-free form, and a quoted key
  # ("theme_map": {) in case the bundle is ever emitted differently. The 0,/re/
  # range stops at the first match so a second mention of theme_map elsewhere
  # in the bundle cannot pick up a duplicate entry.
  local pattern='["'"'"']\?theme_map["'"'"']\?:[[:space:]]*{'
  sed -i "0,/$pattern/s|$pattern|&'$name': '$label', /* $MARKER:$name */|" "$LIB_JS"

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
  backup=$(backup_lib_js)
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
  install -D -m 0755 "${BASH_SOURCE[0]}" "$SELF_INSTALLED"

  # The hook calls `register`, not `install`: re-registration is the only thing
  # an upgrade undoes. Replaying the whole install path meant re-validating,
  # re-copying the sheet and walking the font list, every step of which could
  # abort under set -e before reaching the sed — which is exactly how the
  # same-file install(1) bug hid here. `register` reads the themes directory
  # itself, so it also covers every installed sheet rather than the one whose
  # path happened to be baked in.
  #
  # Output goes to the journal instead of /dev/null: `|| true` keeps a failure
  # from breaking apt, but a silent failure is how the last one survived.
  # Read it with: journalctl -t $MARKER
  cat >"$HOOK_FILE" <<EOF
// Installed by $MARKER — re-registers the ExtJS theme(s) in the theme picker
// after a package upgrade overwrites proxmoxlib.js. The theme itself keeps
// working via the cookie regardless; this only restores the picker entry.
// Remove with: proxmox-theme-install.sh uninstall <name>
DPkg::Post-Invoke { "test -x $SELF_INSTALLED && $SELF_INSTALLED register 2>&1 | logger -t $MARKER || true"; };
EOF
  [ -f "$HOOK_FILE" ] || die "failed to write $HOOK_FILE"
  note "installed APT hook $HOOK_FILE (logs to: journalctl -t $MARKER)"
}

# Re-register every sheet we own. Idempotent, and the verb the APT hook calls.
cmd_register() {
  require_root
  local file name found=0
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    found=1
    name=$(theme_name_from_file "$file")
    register_theme "$name"
  done <<<"$(sv_theme_files)"

  if [ "$found" -eq 0 ]; then
    note "no themes from this design system are installed in $THEME_DIR"
  fi
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

  local target="$THEME_DIR/theme-$name.css"
  is_our_theme "$target" ||
    die "$target was not written by this script — refusing to remove a file the distribution owns"

  unregister_theme "$name"

  if [ -f "$target" ]; then
    rm -f "$target"
    note "removed $target"
  fi

  # The hook goes first. If anything below fails, a surviving hook would
  # re-register the theme on the next dpkg run and the uninstall would appear
  # to undo itself — which is precisely what happened when the font purge
  # below aborted the script.
  local remaining
  remaining=$(sv_theme_files | wc -l)
  if [ "$remaining" -eq 0 ] && [ -f "$HOOK_FILE" ]; then
    rm -f "$HOOK_FILE" "$SELF_INSTALLED"
    note "removed $HOOK_FILE"
  elif [ -f "$HOOK_FILE" ]; then
    note "kept $HOOK_FILE — $remaining other theme(s) from this design system remain"
  fi
  rm -f "$PREFIX/usr/local/share/theme-$name.css"

  if [ "$purge_fonts" -eq 1 ] && [ -d "$FONT_DIR" ]; then
    if [ "$remaining" -eq 0 ]; then
      rm -rf "$FONT_DIR"
      note "removed $FONT_DIR"
    else
      note "kept $FONT_DIR — $remaining other theme(s) still reference it"
    fi
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
    while IFS= read -r file; do
      [ -n "$file" ] || continue
      found=1
      name=$(theme_name_from_file "$file")
      printf 'installed: %s' "$name"
      if [ -f "$LIB_JS" ] && grep -q "$MARKER:$name" "$LIB_JS"; then
        printf ' (registered)'
      else
        printf ' (cookie only)'
      fi
      printf '\n'
    done <<<"$(sv_theme_files)"
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
    while IFS= read -r file; do
      [ -n "$file" ] || continue
      name=$(theme_name_from_file "$file")
      if curl -ksf -o /dev/null "https://localhost:$port$path/theme-$name.css"; then
        printf 'serving:   %s/theme-%s.css OK\n' "$path" "$name"
      else
        printf 'serving:   %s/theme-%s.css NOT reachable\n' "$path" "$name"
      fi
    done <<<"$(sv_theme_files)"
  fi
}

usage() {
  cat >&2 <<EOF
usage: $(basename "$0") install <theme-<name>.css> [--fonts <dir>] [--register] [--apt-hook]
       $(basename "$0") uninstall <name> [--purge-fonts]
       $(basename "$0") register          # re-register installed themes (used by the APT hook)
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
  register) cmd_register ;;
  status) cmd_status ;;
  -h | --help | help) usage ;;
  *) die "unknown command \"$verb\"" ;;
esac
