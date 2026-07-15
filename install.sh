#!/usr/bin/env bash
# ep-starter install — set up Herdr + Pi + the ep-starter package in one command.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/conpiracy/ep-starter/main/install.sh | bash
#
# Optional flags (only usable when the script is downloaded and run directly,
# since a piped shell can't pass args to the pipe target; set env vars instead):
#   EP_STARTER_REF=<git-ref>   pin the ep-starter version (default: main)
#   EP_SKIP_HERDR=1            skip Herdr installation
#   EP_SKIP_PI=1               skip Pi installation
#   EP_LAUNCH=1                exec `herdr` at the end (only if stdout is a TTY)
#
# Re-runnable: each step is idempotent and skips when the binary is present.
set -euo pipefail

REF="${EP_STARTER_REF:-main}"
LAUNCH="${EP_LAUNCH:-0}"
SKIP_HERDR="${EP_SKIP_HERDR:-0}"
SKIP_PI="${EP_SKIP_PI:-0}"

# If invoked directly with args, parse them (lets you re-run ./install.sh --ref v1).
while [ $# -gt 0 ]; do
  case "$1" in
    --launch)     LAUNCH=1; shift ;;
    --skip-herdr) SKIP_HERDR=1; shift ;;
    --skip-pi)    SKIP_PI=1; shift ;;
    --ref)        REF="$2"; shift 2 ;;
    -h|--help)
      cat <<'HELP'
ep-starter install

  curl -fsSL https://raw.githubusercontent.com/conpiracy/ep-starter/main/install.sh | bash

Env:
  EP_STARTER_REF   git ref to install (default: main)
  EP_SKIP_HERDR=1  skip Herdr
  EP_SKIP_PI=1     skip Pi
  EP_LAUNCH=1      exec herdr after install (only when stdout is a TTY)
HELP
      exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 1 ;;
  esac
done

have() { command -v "$1" >/dev/null 2>&1; }
ok()   { printf '\033[32m\342\234\223\033[0m %s\n' "$1"; }
no()   { printf '\033[31m\342\234\227 %s\033[0m\n' "$1" >&2; }

# -- 1. Node 22+ (Pi requirement) -------------------------------
if have node; then
  NODE_MAJ="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
  if [ "$NODE_MAJ" -lt 22 ]; then
    no "Node 22+ required, found $(node -v). Install: https://nodejs.org"
    exit 1
  fi
  ok "Node $(node -v)"
else
  no "Node not found. Install Node 22+ first: https://nodejs.org"
  exit 1
fi

# -- 2. Herdr ---------------------------------------------------
if [ "$SKIP_HERDR" -eq 1 ]; then
  ok "skipping Herdr (EP_SKIP_HERDR=1)"
elif have herdr; then
  ok "Herdr already installed"
else
  echo "Installing Herdr..."
  curl -fsSL https://herdr.dev/install.sh | sh
  if have herdr; then ok "Herdr installed"; else { no "Herdr install failed"; exit 1; }; fi
fi

# -- 3. Pi ------------------------------------------------------
if [ "$SKIP_PI" -eq 1 ]; then
  ok "skipping Pi (EP_SKIP_PI=1)"
elif have pi; then
  ok "Pi already installed"
else
  echo "Installing Pi..."
  npm install -g --ignore-scripts @earendil-works/pi-coding-agent
  if have pi; then ok "Pi installed"; else { no "Pi install failed"; exit 1; }; fi
fi

# -- 4. ep-starter package -------------------------------------
echo "Installing ep-starter package (ref: $REF)..."
if pi install "git:github.com/conpiracy/ep-starter@$REF"; then
  ok "ep-starter installed"
else
  no "pi install failed"
  exit 1
fi

# -- 5. Next steps ---------------------------------------------
cat <<NEXT

ep-starter is ready.

  herdr          # start the multiplexer
  # inside a Herdr pane:
  pi             # start Pi (ep-starter already installed)
  /setup         # orientation
  /scaffold <n>  # interview -> agent researches+tests+builds a capability

NEXT

if [ "$LAUNCH" -eq 1 ] && [ -t 1 ]; then
  exec herdr
fi