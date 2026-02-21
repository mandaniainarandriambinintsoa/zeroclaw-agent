#!/bin/sh
# Send an email via Gmail API
# Usage: sh scripts/gmail-send.sh "to@example.com" "Subject" "Body text"
# Output: message ID on success, error on failure

if [ $# -lt 3 ]; then
    echo "ERROR: usage: gmail-send.sh TO SUBJECT BODY" >&2
    exit 1
fi

TO="$1"
SUBJECT="$2"
BODY="$3"

# Get access token
SCRIPT_DIR="$(dirname "$0")"
TOKEN=$("$SCRIPT_DIR/gmail-token.sh")
if [ $? -ne 0 ] || [ -z "$TOKEN" ]; then
    echo "ERROR: failed to get access token" >&2
    exit 1
fi

# Build RFC 2822 MIME message
MIME="To: ${TO}\r\nSubject: ${SUBJECT}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${BODY}"

# Base64url encode (no jq, no python, just base64 + tr)
RAW=$(printf '%b' "$MIME" | base64 -w 0 | tr '+/' '-_' | tr -d '=')

# Send via Gmail API
RESPONSE=$(curl -s -X POST \
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"raw\": \"${RAW}\"}")

# Check for error
ERROR=$(echo "$RESPONSE" | grep -o '"message": *"[^"]*"' | head -1 | sed 's/"message": *"//;s/"$//')
if [ -n "$ERROR" ]; then
    echo "ERROR: $ERROR" >&2
    exit 1
fi

# Extract message ID
MSG_ID=$(echo "$RESPONSE" | grep -o '"id": *"[^"]*"' | head -1 | sed 's/"id": *"//;s/"$//')
echo "Email envoye avec succes. ID: $MSG_ID"
