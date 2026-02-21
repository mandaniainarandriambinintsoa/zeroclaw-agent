#!/bin/sh
# Get a fresh Gmail access token using OAuth2 refresh flow
# Usage: sh scripts/gmail-token.sh
# Output: just the access_token string (nothing else)

CRED_FILE="$(dirname "$0")/../credentials/google.env"

if [ ! -f "$CRED_FILE" ]; then
    echo "ERROR: credentials file not found at $CRED_FILE" >&2
    exit 1
fi

# Source the credentials
. "$CRED_FILE"

if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ] || [ -z "$GOOGLE_REFRESH_TOKEN" ]; then
    echo "ERROR: missing Google OAuth credentials (ID=${GOOGLE_CLIENT_ID:+set} SECRET=${GOOGLE_CLIENT_SECRET:+set} REFRESH=${GOOGLE_REFRESH_TOKEN:+set})" >&2
    exit 1
fi

# Request new access token
RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=refresh_token&client_id=${GOOGLE_CLIENT_ID}&client_secret=${GOOGLE_CLIENT_SECRET}&refresh_token=${GOOGLE_REFRESH_TOKEN}")

# Extract access_token using jq (with grep fallback)
TOKEN=$(echo "$RESPONSE" | jq -r '.access_token // empty' 2>/dev/null)

if [ -z "$TOKEN" ]; then
    # Fallback: grep-based extraction
    TOKEN=$(echo "$RESPONSE" | grep -o '"access_token": *"[^"]*"' | head -1 | sed 's/"access_token": *"//;s/"$//')
fi

if [ -z "$TOKEN" ]; then
    # Show the error from Google's OAuth endpoint
    ERROR_DESC=$(echo "$RESPONSE" | jq -r '.error_description // .error // empty' 2>/dev/null)
    echo "ERROR: failed to get access token. Error: ${ERROR_DESC:-unknown}. Full response: $RESPONSE" >&2
    exit 1
fi

echo "$TOKEN"
