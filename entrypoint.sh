#!/bin/sh
# ZeroClaw runtime entrypoint
# Injects secrets from environment variables into config before starting.
set -e

CONFIG=/zeroclaw-data/.zeroclaw/config.toml

# Inject Telegram bot token
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    sed -i "s|bot_token = \"\"|bot_token = \"$TELEGRAM_BOT_TOKEN\"|" "$CONFIG"
fi

exec zeroclaw "$@"
