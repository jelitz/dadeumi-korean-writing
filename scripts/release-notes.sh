#!/usr/bin/env bash
# Print the body of the "## [<version>]" section of CHANGELOG.md.
# Usage: scripts/release-notes.sh <version> [changelog-path]
# Exits 1 when the section does not exist, so release.yml fails instead of
# publishing an empty release body.
set -euo pipefail

version=${1:?usage: release-notes.sh <version> [changelog-path]}
file=${2:-CHANGELOG.md}

awk -v tag="$version" '
  /^## /            { if (found) exit; found = ($2 == "[" tag "]"); next }
  /^\[[^]]+\]: /    { if (found) exit }   # link references at the bottom end the last section
  found             { lines[++n] = $0 }
  END {
    if (!n) { print "release-notes.sh: no \"## [" tag "]\" section in " FILENAME > "/dev/stderr"; exit 1 }
    s = 1; while (s <= n && lines[s] == "") s++
    e = n; while (e >= s && lines[e] == "") e--
    for (i = s; i <= e; i++) print lines[i]
  }
' "$file"
