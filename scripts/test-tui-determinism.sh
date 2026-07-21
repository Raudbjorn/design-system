#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT

cd "$repo_root"
cargo build --quiet -p raudbjorn-tui --example gallery --target-dir "$tmp_dir/target"
gallery="$tmp_dir/target/debug/examples/gallery"

mapfile -t stories < <("$gallery" --list)
if (( ${#stories[@]} != 115 )); then
  printf 'expected 115 gallery stories, got %d\n' "${#stories[@]}" >&2
  exit 1
fi

unique_ids=$(
  printf '%s\n' "${stories[@]}" |
    cut -f1 |
    sort -u |
    wc -l
)
unique_labels=$(
  printf '%s\n' "${stories[@]}" |
    cut -f2-3 |
    sort -u |
    wc -l
)
if (( unique_ids != 115 || unique_labels != 115 )); then
  printf 'gallery list contains duplicate IDs or labels\n' >&2
  exit 1
fi

if "$gallery" --dump missing/story >"$tmp_dir/unknown.out" 2>&1; then
  printf 'unknown story unexpectedly succeeded\n' >&2
  exit 1
fi
if [[ $(<"$tmp_dir/unknown.out") != *'missing/story'* ]]; then
  printf 'unknown story did not produce the expected diagnostic\n' >&2
  exit 1
fi

no_color=$(NO_COLOR=1 "$gallery" --dump alert/error --width 60 --height 5)
if [[ $no_color != *'ERROR: sonarr is unavailable'* ]]; then
  printf 'NO_COLOR dump lost the semantic error label or message\n' >&2
  exit 1
fi

cases=(
  'text/default 24 1'
  'spinner/animated 40 3'
  'view/homelab-healthy 120 30'
)

for case_spec in "${cases[@]}"; do
  read -r story width height <<<"$case_spec"
  baseline="$tmp_dir/${story//\//__}.baseline"
  "$gallery" --dump "$story" --width "$width" --height "$height" >"$baseline"

  if [[ $(<"$baseline") == *'[WARN]'* ]]; then
    printf '%s rendered a Crepus warning\n' "$story" >&2
    exit 1
  fi

  for run in {1..10}; do
    actual="$tmp_dir/${story//\//__}.$run"
    "$gallery" --dump "$story" --width "$width" --height "$height" >"$actual"
    if ! cmp --silent "$baseline" "$actual"; then
      printf '%s changed on fresh-process render %d\n' "$story" "$run" >&2
      exit 1
    fi
  done
done

printf 'native gallery smoke: 115 unique stories; unknown-story and NO_COLOR process checks pass; 3 stories stable across 10 fresh processes\n'
