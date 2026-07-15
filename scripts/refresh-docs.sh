#!/usr/bin/env bash
# Re-download Herdr + Pi documentation from online sources.
# Run from repo root, or pass root as $1.
set -euo pipefail

ROOT="${1:-$(dirname "$0")/..}"
cd "$ROOT"

echo "Refreshing Herdr documentation..."

curl -fsSL "https://herdr.dev/agent-guide.md" \
  -o docs/herdr/agent-guide.md 2>/dev/null || true
curl -fsSL "https://raw.githubusercontent.com/ogulcancelik/herdr/master/SKILL.md" \
  -o docs/herdr/SKILL.md 2>/dev/null || true

fetch_html() {
  local url="$1" out="$2"
  echo "  -> $out"
  curl -fsSL "$url" 2>/dev/null \
    | sed 's/<[^>]*>//g' \
    | sed '/^$/N;/^\n$/D' \
    > "$out" 2>/dev/null || echo "  failed: $url"
}

fetch_html "https://herdr.dev/docs/install/" docs/herdr/install.txt
fetch_html "https://herdr.dev/docs/quick-start/" docs/herdr/quick-start.txt
fetch_html "https://herdr.dev/docs/concepts/" docs/herdr/concepts.txt
fetch_html "https://herdr.dev/docs/agents/" docs/herdr/agents.txt
fetch_html "https://herdr.dev/docs/configuration/" docs/herdr/configuration.txt
fetch_html "https://herdr.dev/docs/socket-api/" docs/herdr/socket-api.txt
fetch_html "https://herdr.dev/docs/plugins/" docs/herdr/plugins.txt
fetch_html "https://herdr.dev/docs/session-state/" docs/herdr/session-state.txt
fetch_html "https://herdr.dev/docs/cli-reference/" docs/herdr/cli-reference.txt
fetch_html "https://herdr.dev/docs/how-to-work/" docs/herdr/how-to-work.txt

echo "Refreshing Pi documentation..."

fetch_html "https://pi.dev/docs/latest/quickstart" docs/pi/quickstart.txt
fetch_html "https://pi.dev/docs/latest/usage" docs/pi/usage.txt
fetch_html "https://pi.dev/docs/latest/providers" docs/pi/providers.txt
fetch_html "https://pi.dev/docs/latest/extensions" docs/pi/extensions.txt
fetch_html "https://pi.dev/docs/latest/skills" docs/pi/skills.txt
fetch_html "https://pi.dev/docs/latest/packages" docs/pi/packages.txt
fetch_html "https://pi.dev/docs/latest/sdk" docs/pi/sdk.txt
fetch_html "https://pi.dev/docs/latest/settings" docs/pi/settings.txt
fetch_html "https://pi.dev/docs/latest/sessions" docs/pi/sessions.txt
fetch_html "https://pi.dev/docs/latest/security" docs/pi/security.txt
fetch_html "https://pi.dev/docs/latest/rpc" docs/pi/rpc.txt
fetch_html "https://pi.dev/docs/latest/keybindings" docs/pi/keybindings.txt
fetch_html "https://pi.dev/docs/latest/themes" docs/pi/themes.txt
fetch_html "https://pi.dev/docs/latest/models" docs/pi/models.txt
fetch_html "https://pi.dev/docs/latest/prompt-templates" docs/pi/prompt-templates.txt
fetch_html "https://pi.dev/docs/latest/tui" docs/pi/tui.txt
fetch_html "https://pi.dev/docs/latest" docs/pi/overview.txt

curl -fsSL "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/README.md" \
  -o docs/pi/README.md 2>/dev/null || true

echo "Documentation refresh complete."
echo "  docs/herdr/  — $(ls -1 docs/herdr/ | wc -l) files"
echo "  docs/pi/     — $(ls -1 docs/pi/ | wc -l) files"
