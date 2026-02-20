#!/bin/sh
# ZeroClaw runtime entrypoint
# Injects secrets from environment variables into config before starting.
set -e

CONFIG=/zeroclaw-data/.zeroclaw/config.toml

# Inject Telegram bot token
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    sed -i "s|bot_token = \"\"|bot_token = \"$TELEGRAM_BOT_TOKEN\"|" "$CONFIG"
fi

# ── Google OAuth credentials (for Gmail API) ──────────────────
CRED_DIR=/zeroclaw-data/credentials
mkdir -p "$CRED_DIR" 2>/dev/null || true

if [ -n "$GOOGLE_CLIENT_ID" ] || [ -n "$GOOGLE_CLIENT_SECRET" ] || [ -n "$GOOGLE_REFRESH_TOKEN" ]; then
    cat > "$CRED_DIR/google.env" <<EOF
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_REFRESH_TOKEN=${GOOGLE_REFRESH_TOKEN}
EOF
fi

# ── GitHub CLI auth ───────────────────────────────────────────
if [ -n "$GITHUB_TOKEN" ]; then
    export GH_TOKEN="$GITHUB_TOKEN"
    git config --global credential.helper store 2>/dev/null || true
fi

# ── Git config (required for commits) ─────────────────────────
git config --global user.name "ZeroClaw Agent" 2>/dev/null || true
git config --global user.email "zeroclaw@agent.local" 2>/dev/null || true

exec zeroclaw "$@"
